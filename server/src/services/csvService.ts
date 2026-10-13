import { stringify } from 'csv-stringify/sync';
import { prisma } from '../prisma.js';
import { calculateCompleteness, validateProductData } from '../utils/validation.js';

export interface CSVImportOptions {
  skipErrors?: boolean;
  updateExisting?: boolean;
}

export class CSVService {
  static parseCSVText(csvContent: string): {
    totalRows: number;
    validRows: number;
    errorRows: number;
    headers: string[];
    rows: Array<{
      rowIndex: number;
      data: any;
      isValid: boolean;
      errors: string[];
    }>;
  } {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('The uploaded CSV file is empty.');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: any[] = [];
    const seenSkus = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Handle simple CSV splitting with quotes
      const values: string[] = [];
      let inQuotes = false;
      let currentVal = '';

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] ? values[idx].replace(/^["']|["']$/g, '') : '';
      });

      // Map to standard product fields
      const name = rowObj['Name'] || rowObj['Product Name'] || rowObj['title'] || '';
      const sku = rowObj['SKU'] || rowObj['sku'] || '';
      const regPriceStr = rowObj['Regular Price'] || rowObj['regular_price'] || rowObj['Price'] || '0';
      const salePriceStr = rowObj['Sale Price'] || rowObj['sale_price'] || '';
      const stockStr = rowObj['Stock Quantity'] || rowObj['stock_quantity'] || rowObj['Stock'] || '0';
      const stockStatus = (rowObj['Stock Status'] || rowObj['stock_status'] || 'INSTOCK').toUpperCase();
      const categories = rowObj['Categories'] || rowObj['categories'] || rowObj['Category'] || '';
      const tags = rowObj['Tags'] || rowObj['tags'] || '';
      const shortDesc = rowObj['Short Description'] || rowObj['short_description'] || '';
      const desc = rowObj['Description'] || rowObj['description'] || '';
      const images = rowObj['Images'] || rowObj['images'] || '';
      const attributes = rowObj['Attributes'] || rowObj['attributes'] || '';

      const regularPrice = parseFloat(regPriceStr);
      const salePrice = salePriceStr ? parseFloat(salePriceStr) : null;
      const stockQuantity = parseInt(stockStr, 10);

      const parsedData = {
        name,
        sku,
        regularPrice: isNaN(regularPrice) ? 0 : regularPrice,
        salePrice: isNaN(salePrice as any) ? null : salePrice,
        stockQuantity: isNaN(stockQuantity) ? 0 : stockQuantity,
        stockStatus: ['INSTOCK', 'OUTOFSTOCK', 'ONBACKORDER'].includes(stockStatus) ? stockStatus : 'INSTOCK',
        shortDescription: shortDesc,
        description: desc,
        categories: categories ? categories.split(';').map(c => c.trim()).filter(Boolean) : [],
        tags: tags ? tags.split(';').map(t => t.trim()).filter(Boolean) : [],
        images: images ? images.split(';').map(img => img.trim()).filter(Boolean) : [],
        attributes: attributes ? this.parseAttributeString(attributes) : [],
      };

      const rowValidation = validateProductData(parsedData);
      const rowErrors = [...rowValidation.errors];

      if (sku && seenSkus.has(sku)) {
        rowErrors.push(`Duplicate SKU "${sku}" detected within the same CSV file.`);
      } else if (sku) {
        seenSkus.add(sku);
      }

      rows.push({
        rowIndex: i,
        data: parsedData,
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      });
    }

    const validRows = rows.filter(r => r.isValid).length;
    const errorRows = rows.filter(r => !r.isValid).length;

    return {
      totalRows: rows.length,
      validRows,
      errorRows,
      headers,
      rows,
    };
  }

  private static parseAttributeString(attrStr: string): any[] {
    try {
      if (attrStr.startsWith('[') || attrStr.startsWith('{')) {
        return JSON.parse(attrStr);
      }
    } catch {
      // ignore
    }
    // Format: "Color: Red|Blue, Size: M|L"
    const items = attrStr.split(',').map(item => item.trim());
    return items.map(item => {
      const [name, vals] = item.split(':').map(p => p.trim());
      return {
        name: name || 'Attribute',
        values: vals ? vals.split('|').map(v => v.trim()) : [],
      };
    }).filter(a => a.name);
  }

  static async executeImport(parsedRows: any[], options: CSVImportOptions = {}, userId?: string, userName: string = 'System'): Promise<{
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    errors: any[];
  }> {
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    for (const item of parsedRows) {
      if (!item.isValid && !options.skipErrors) {
        throw new Error(`Row ${item.rowIndex} has validation errors: ${item.errors.join(', ')}`);
      }

      if (!item.isValid && options.skipErrors) {
        skippedCount++;
        errors.push({ rowIndex: item.rowIndex, errors: item.errors });
        continue;
      }

      const pData = item.data;
      const existing = await prisma.product.findUnique({ where: { sku: pData.sku } });

      const completeness = calculateCompleteness(pData);

      if (existing) {
        if (options.updateExisting) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: pData.name,
              regularPrice: pData.regularPrice,
              salePrice: pData.salePrice,
              stockQuantity: pData.stockQuantity,
              stockStatus: pData.stockStatus,
              shortDescription: pData.shortDescription,
              description: pData.description,
              categories: JSON.stringify(pData.categories),
              tags: JSON.stringify(pData.tags),
              images: JSON.stringify(pData.images),
              attributes: JSON.stringify(pData.attributes),
              completenessScore: completeness.score,
              missingFields: JSON.stringify(completeness.missingFields),
              syncStatus: 'PENDING',
            },
          });
          updatedCount++;
        } else {
          skippedCount++;
          errors.push({ rowIndex: item.rowIndex, errors: [`SKU "${pData.sku}" already exists. Check "Update Existing" to overwrite.`] });
        }
      } else {
        const slug = pData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await prisma.product.create({
          data: {
            name: pData.name,
            sku: pData.sku,
            slug: slug || `product-${Date.now()}`,
            regularPrice: pData.regularPrice,
            salePrice: pData.salePrice,
            stockQuantity: pData.stockQuantity,
            stockStatus: pData.stockStatus,
            shortDescription: pData.shortDescription,
            description: pData.description,
            categories: JSON.stringify(pData.categories),
            tags: JSON.stringify(pData.tags),
            images: JSON.stringify(pData.images),
            attributes: JSON.stringify(pData.attributes),
            completenessScore: completeness.score,
            missingFields: JSON.stringify(completeness.missingFields),
            status: 'PUBLISHED',
            syncStatus: 'PENDING',
          },
        });
        importedCount++;
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action: 'CSV_IMPORTED',
        entityType: 'CSV',
        details: JSON.stringify({ importedCount, updatedCount, skippedCount }),
      },
    });

    return {
      importedCount,
      updatedCount,
      skippedCount,
      errors,
    };
  }

  static async exportProductsCSV(filters?: any): Promise<string> {
    const whereClause: any = {};
    if (filters?.category) {
      whereClause.categories = { contains: filters.category };
    }
    if (filters?.syncStatus) {
      whereClause.syncStatus = filters.syncStatus;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const rows = products.map(p => {
      const cats = JSON.parse(p.categories || '[]');
      const tags = JSON.parse(p.tags || '[]');
      const imgs = JSON.parse(p.images || '[]');
      const attrs = JSON.parse(p.attributes || '[]');
      const formattedAttrs = attrs.map((a: any) => `${a.name}: ${(a.values || []).join('|')}`).join(', ');

      return {
        Name: p.name,
        SKU: p.sku,
        'Regular Price': p.regularPrice.toFixed(2),
        'Sale Price': p.salePrice ? p.salePrice.toFixed(2) : '',
        'Stock Quantity': p.stockQuantity,
        'Stock Status': p.stockStatus,
        Categories: Array.isArray(cats) ? cats.join(';') : '',
        Tags: Array.isArray(tags) ? tags.join(';') : '',
        'Short Description': p.shortDescription || '',
        Description: p.description || '',
        Images: Array.isArray(imgs) ? imgs.join(';') : '',
        Attributes: formattedAttrs,
        'Sync Status': p.syncStatus,
        'WooCommerce ID': p.remoteWooId || '',
        'Completeness (%)': p.completenessScore,
      };
    });

    return stringify(rows, { header: true });
  }

  static getSampleTemplate(): string {
    const sampleRows = [
      {
        Name: 'Titanium Ergonomic Wireless Mouse',
        SKU: 'ACC-MS-009',
        'Regular Price': '69.99',
        'Sale Price': '59.99',
        'Stock Quantity': '40',
        'Stock Status': 'INSTOCK',
        Categories: 'Electronics;Accessories',
        Tags: 'Ergonomic;Wireless;Bluetooth',
        'Short Description': 'Precision ergonomic mouse with dual Bluetooth & 2.4GHz dongle.',
        Description: 'Engineered for all-day comfort with silent magnetic switches and ultra-accurate 4000 DPI optical sensor.',
        Images: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800',
        Attributes: 'Color: Midnight Black|Space Gray, Connectivity: Bluetooth 5.2|Wireless USB',
        Status: 'PUBLISHED',
      },
      {
        Name: 'Organic Cotton Canvas Backpack',
        SKU: 'APP-BP-010',
        'Regular Price': '89.00',
        'Sale Price': '',
        'Stock Quantity': '25',
        'Stock Status': 'INSTOCK',
        Categories: 'Apparel;Accessories',
        Tags: 'Eco;Cotton;Travel',
        'Short Description': 'Water-resistant natural canvas backpack with 16-inch laptop compartment.',
        Description: 'Crafted from 100% GOTS-certified organic cotton canvas with genuine brass hardware and reinforced stitching.',
        Images: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
        Attributes: 'Color: Khaki|Navy Blue, Capacity: 22L',
        Status: 'PUBLISHED',
      },
    ];

    return stringify(sampleRows, { header: true });
  }
}
