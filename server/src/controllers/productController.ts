import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { calculateCompleteness, validateProductData } from '../utils/validation.js';

export class ProductController {
  static async listProducts(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.q as string || '').trim().toLowerCase();
      const category = req.query.category as string;
      const syncStatus = req.query.syncStatus as string;
      const status = req.query.status as string;
      const completeness = req.query.completeness as string;
      const sort = (req.query.sort as string) || 'date_desc';

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { sku: { contains: search } },
          { description: { contains: search } },
        ];
      }

      if (category && category !== 'ALL') {
        where.categories = { contains: category };
      }

      if (syncStatus && syncStatus !== 'ALL') {
        where.syncStatus = syncStatus;
      }

      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (completeness) {
        if (completeness === 'high') where.completenessScore = { gte: 80 };
        else if (completeness === 'medium') where.completenessScore = { gte: 50, lt: 80 };
        else if (completeness === 'low') where.completenessScore = { lt: 50 };
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'date_asc') orderBy = { createdAt: 'asc' };
      else if (sort === 'name_asc') orderBy = { name: 'asc' };
      else if (sort === 'name_desc') orderBy = { name: 'desc' };
      else if (sort === 'price_asc') orderBy = { regularPrice: 'asc' };
      else if (sort === 'price_desc') orderBy = { regularPrice: 'desc' };
      else if (sort === 'completeness_desc') orderBy = { completenessScore: 'desc' };
      else if (sort === 'completeness_asc') orderBy = { completenessScore: 'asc' };
      else if (sort === 'sku_asc') orderBy = { sku: 'asc' };

      const total = await prisma.product.count({ where });
      const products = await prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      return res.json({
        products: products.map(p => ({
          ...p,
          categories: JSON.parse(p.categories || '[]'),
          tags: JSON.parse(p.tags || '[]'),
          attributes: JSON.parse(p.attributes || '[]'),
          images: JSON.parse(p.images || '[]'),
          missingFields: JSON.parse(p.missingFields || '[]'),
          conflictDetails: p.conflictDetails ? JSON.parse(p.conflictDetails) : null,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return res.status(404).json({ error: 'Product not found.' });

      return res.json({
        ...product,
        categories: JSON.parse(product.categories || '[]'),
        tags: JSON.parse(product.tags || '[]'),
        attributes: JSON.parse(product.attributes || '[]'),
        images: JSON.parse(product.images || '[]'),
        missingFields: JSON.parse(product.missingFields || '[]'),
        conflictDetails: product.conflictDetails ? JSON.parse(product.conflictDetails) : null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async createProduct(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const validation = validateProductData(data);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(' ') });
      }

      // Check unique SKU
      const existingSku = await prisma.product.findUnique({ where: { sku: data.sku.trim() } });
      if (existingSku) {
        return res.status(400).json({ error: `A product with SKU "${data.sku}" already exists.` });
      }

      const completeness = calculateCompleteness(data);
      const slug = (data.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;

      const product = await prisma.product.create({
        data: {
          name: data.name.trim(),
          sku: data.sku.trim(),
          slug,
          shortDescription: data.shortDescription || '',
          description: data.description || '',
          regularPrice: parseFloat(data.regularPrice) || 0,
          salePrice: data.salePrice !== undefined && data.salePrice !== null && data.salePrice !== ''
            ? parseFloat(data.salePrice) : null,
          costPrice: data.costPrice !== undefined && data.costPrice !== null && data.costPrice !== ''
            ? parseFloat(data.costPrice) : null,
          stockQuantity: parseInt(data.stockQuantity, 10) || 0,
          stockStatus: data.stockStatus || 'INSTOCK',
          manageStock: data.manageStock !== undefined ? !!data.manageStock : true,
          categories: JSON.stringify(Array.isArray(data.categories) ? data.categories : []),
          tags: JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
          attributes: JSON.stringify(Array.isArray(data.attributes) ? data.attributes : []),
          images: JSON.stringify(Array.isArray(data.images) ? data.images : []),
          completenessScore: completeness.score,
          missingFields: JSON.stringify(completeness.missingFields),
          status: data.status || 'PUBLISHED',
          syncStatus: 'DRAFT',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user?.name || 'System',
          action: 'PRODUCT_CREATED',
          entityType: 'PRODUCT',
          entityId: product.id,
          details: JSON.stringify({ name: product.name, sku: product.sku }),
        },
      });

      return res.status(201).json({
        ...product,
        categories: JSON.parse(product.categories),
        tags: JSON.parse(product.tags),
        attributes: JSON.parse(product.attributes),
        images: JSON.parse(product.images),
        missingFields: JSON.parse(product.missingFields),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Product not found.' });

      const validation = validateProductData(data);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(' ') });
      }

      // Check SKU collision
      if (data.sku.trim() !== existing.sku) {
        const skuTaken = await prisma.product.findUnique({ where: { sku: data.sku.trim() } });
        if (skuTaken) {
          return res.status(400).json({ error: `A product with SKU "${data.sku}" already exists.` });
        }
      }

      const completeness = calculateCompleteness(data);

      // If product was IN_SYNC and fields changed, mark as PENDING sync
      let newSyncStatus = existing.syncStatus;
      if (existing.syncStatus === 'IN_SYNC') {
        newSyncStatus = 'PENDING';
      }

      const updated = await prisma.product.update({
        where: { id },
        data: {
          name: data.name.trim(),
          sku: data.sku.trim(),
          shortDescription: data.shortDescription || '',
          description: data.description || '',
          regularPrice: parseFloat(data.regularPrice) || 0,
          salePrice: data.salePrice !== undefined && data.salePrice !== null && data.salePrice !== ''
            ? parseFloat(data.salePrice) : null,
          costPrice: data.costPrice !== undefined && data.costPrice !== null && data.costPrice !== ''
            ? parseFloat(data.costPrice) : null,
          stockQuantity: parseInt(data.stockQuantity, 10) || 0,
          stockStatus: data.stockStatus || 'INSTOCK',
          manageStock: data.manageStock !== undefined ? !!data.manageStock : true,
          categories: JSON.stringify(Array.isArray(data.categories) ? data.categories : []),
          tags: JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
          attributes: JSON.stringify(Array.isArray(data.attributes) ? data.attributes : []),
          images: JSON.stringify(Array.isArray(data.images) ? data.images : []),
          completenessScore: completeness.score,
          missingFields: JSON.stringify(completeness.missingFields),
          status: data.status || existing.status,
          syncStatus: newSyncStatus,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user?.name || 'System',
          action: 'PRODUCT_UPDATED',
          entityType: 'PRODUCT',
          entityId: updated.id,
          details: JSON.stringify({ name: updated.name, sku: updated.sku, completeness: updated.completenessScore }),
        },
      });

      return res.json({
        ...updated,
        categories: JSON.parse(updated.categories),
        tags: JSON.parse(updated.tags),
        attributes: JSON.parse(updated.attributes),
        images: JSON.parse(updated.images),
        missingFields: JSON.parse(updated.missingFields),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return res.status(404).json({ error: 'Product not found.' });

      await prisma.product.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user?.name || 'System',
          action: 'PRODUCT_DELETED',
          entityType: 'PRODUCT',
          entityId: id,
          details: JSON.stringify({ name: product.name, sku: product.sku }),
        },
      });

      return res.json({ success: true, message: `Product "${product.name}" deleted.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async duplicateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const src = await prisma.product.findUnique({ where: { id } });
      if (!src) return res.status(404).json({ error: 'Product not found.' });

      const newSku = `${src.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`;
      const newName = `${src.name} (Copy)`;

      const copy = await prisma.product.create({
        data: {
          name: newName,
          sku: newSku,
          slug: `${src.slug}-copy-${Date.now()}`,
          shortDescription: src.shortDescription,
          description: src.description,
          regularPrice: src.regularPrice,
          salePrice: src.salePrice,
          costPrice: src.costPrice,
          stockQuantity: src.stockQuantity,
          stockStatus: src.stockStatus,
          manageStock: src.manageStock,
          categories: src.categories,
          tags: src.tags,
          attributes: src.attributes,
          images: src.images,
          completenessScore: src.completenessScore,
          missingFields: src.missingFields,
          status: 'DRAFT',
          syncStatus: 'DRAFT',
          remoteWooId: null,
          lastSyncedAt: null,
        },
      });

      return res.status(201).json({
        ...copy,
        categories: JSON.parse(copy.categories),
        tags: JSON.parse(copy.tags),
        attributes: JSON.parse(copy.attributes),
        images: JSON.parse(copy.images),
        missingFields: JSON.parse(copy.missingFields),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const totalProducts = await prisma.product.count();
      const syncedCount = await prisma.product.count({ where: { syncStatus: 'IN_SYNC' } });
      const pendingCount = await prisma.product.count({ where: { syncStatus: 'PENDING' } });
      const conflictCount = await prisma.product.count({ where: { hasConflict: true } });
      const errorCount = await prisma.product.count({ where: { syncStatus: 'ERROR' } });
      const draftCount = await prisma.product.count({ where: { syncStatus: 'DRAFT' } });

      const products = await prisma.product.findMany({
        select: {
          completenessScore: true,
          missingFields: true,
          categories: true,
          syncStatus: true,
        },
      });

      const avgCompleteness = totalProducts > 0
        ? Math.round(products.reduce((acc, p) => acc + p.completenessScore, 0) / totalProducts)
        : 0;

      let missingImagesCount = 0;
      let missingDescCount = 0;
      let missingPriceCount = 0;
      let missingCategoryCount = 0;

      const categoryCounts: Record<string, number> = {};

      products.forEach(p => {
        const missing = JSON.parse(p.missingFields || '[]');
        if (missing.includes('images')) missingImagesCount++;
        if (missing.includes('description')) missingDescCount++;
        if (missing.includes('regularPrice')) missingPriceCount++;
        if (missing.includes('categories')) missingCategoryCount++;

        const cats = JSON.parse(p.categories || '[]');
        cats.forEach((c: string) => {
          categoryCounts[c] = (categoryCounts[c] || 0) + 1;
        });
      });

      const recentJobs = await prisma.syncJob.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      const recentAudit = await prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        totalProducts,
        syncedCount,
        pendingCount,
        conflictCount,
        errorCount,
        draftCount,
        averageCompleteness: avgCompleteness,
        completenessBreakdown: {
          missingImages: missingImagesCount,
          missingDescriptions: missingDescCount,
          missingPrices: missingPriceCount,
          missingCategories: missingCategoryCount,
        },
        categoryDistribution: Object.entries(categoryCounts).map(([name, count]) => ({ name, count })),
        recentJobs,
        recentAudit,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
