import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../prisma.js';
import { calculateCompleteness, validateProductData } from '../utils/validation.js';
import { CSVService } from '../services/csvService.js';
import { WooCommerceService } from '../services/wooService.js';
import { SyncService } from '../services/syncService.js';

describe('SyncSphere PIM Core Test Suite', () => {
  beforeAll(async () => {
    // Ensure clean state for test product if it exists
    await prisma.product.deleteMany({ where: { sku: { in: ['TEST-SKU-001', 'TEST-CSV-001'] } } });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { sku: { in: ['TEST-SKU-001', 'TEST-CSV-001'] } } });
    await prisma.$disconnect();
  });

  describe('Completeness Scoring Algorithm', () => {
    it('should calculate 100% completeness for a fully populated product', () => {
      const fullProduct = {
        name: 'Ultra Pro Wireless Mouse',
        sku: 'MOU-001',
        regularPrice: 49.99,
        description: 'High-performance ergonomic wireless mouse with RGB lighting.',
        shortDescription: 'Ergonomic mouse with dual modes.',
        images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        categories: ['Electronics', 'Accessories'],
        attributes: [{ name: 'Color', values: ['Black'] }],
      };

      const result = calculateCompleteness(fullProduct);
      expect(result.score).toBe(100);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should penalize missing images and descriptions', () => {
      const incompleteProduct = {
        name: 'Draft Item',
        sku: 'DRF-001',
        regularPrice: 10.0,
      };

      const result = calculateCompleteness(incompleteProduct);
      expect(result.score).toBeLessThan(60);
      expect(result.missingFields).toContain('description');
      expect(result.missingFields).toContain('images');
      expect(result.missingFields).toContain('categories');
    });
  });

  describe('Validation & Duplicate SKU Prevention', () => {
    it('should reject invalid pricing or missing names', () => {
      const invalid = validateProductData({ name: '', sku: 'SKU1', regularPrice: -5 });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });

    it('should validate good product data', () => {
      const valid = validateProductData({ name: 'Good Item', sku: 'SKU-OK', regularPrice: 25.5 });
      expect(valid.isValid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });
  });

  describe('Product CRUD in Relational Database', () => {
    it('should create and retrieve a product in the database', async () => {
      const created = await prisma.product.create({
        data: {
          name: 'Test Database Product',
          sku: 'TEST-SKU-001',
          slug: 'test-database-product',
          regularPrice: 99.0,
          completenessScore: 80,
          categories: JSON.stringify(['Electronics']),
          status: 'DRAFT',
          syncStatus: 'DRAFT',
        },
      });

      expect(created.id).toBeDefined();
      expect(created.sku).toBe('TEST-SKU-001');

      const fetched = await prisma.product.findUnique({ where: { sku: 'TEST-SKU-001' } });
      expect(fetched?.name).toBe('Test Database Product');
    });

    it('should enforce unique SKU constraint in database', async () => {
      await expect(
        prisma.product.create({
          data: {
            name: 'Duplicate SKU Item',
            sku: 'TEST-SKU-001', // already used above
            slug: 'duplicate-item',
            regularPrice: 20,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('CSV Import & Export Engine', () => {
    it('should parse CSV text and report row-level validation', () => {
      const sampleCSV = `Name,SKU,Regular Price,Stock Quantity\n"Valid Keyboard","KB-101",59.99,10\n"","INVALID-NO-NAME",30,5\n"Bad Price","BP-102",-10,0`;
      const parsed = CSVService.parseCSVText(sampleCSV);

      expect(parsed.totalRows).toBe(3);
      expect(parsed.validRows).toBe(1);
      expect(parsed.errorRows).toBe(2);
      expect(parsed.rows[1].isValid).toBe(false); // row 2 missing name
      expect(parsed.rows[2].isValid).toBe(false); // row 3 negative price
    });

    it('should detect duplicate SKUs within CSV', () => {
      const dupCSV = `Name,SKU,Regular Price\n"Item 1","DUP-01",10\n"Item 2","DUP-01",20`;
      const parsed = CSVService.parseCSVText(dupCSV);
      expect(parsed.rows[1].errors[0]).toContain('Duplicate SKU "DUP-01"');
    });

    it('should import parsed row objects into the catalog', async () => {
      const parsed = CSVService.parseCSVText(
        'Name,SKU,Regular Price,Stock Quantity\n"Test CSV Product","TEST-CSV-001",19.99,5'
      );

      const result = await CSVService.executeImport(parsed.rows);
      expect(result.importedCount).toBe(1);
      expect(await prisma.product.findUnique({ where: { sku: 'TEST-CSV-001' } })).not.toBeNull();
    });
  });

  describe('WooCommerce Integration & Sync Service', () => {
    it('should verify connection in demo mode with latency reporting', async () => {
      const testResult = await WooCommerceService.testConnection({ isDemoMode: true });
      expect(testResult.success).toBe(true);
      expect(testResult.isSimulated).toBe(true);
      expect(testResult.pingMs).toBeGreaterThan(0);
    });

    it('should push product to WooCommerce and record sync job', async () => {
      const product = await prisma.product.findFirst({ where: { syncStatus: { not: 'CONFLICT' } } });
      if (!product) throw new Error('No product found to test push');

      const pushResult = await SyncService.pushProduct(product.id, 'test-user-id', 'Test User');
      expect(pushResult.success).toBe(true);
      expect(pushResult.remoteId).toBeDefined();

      const job = await prisma.syncJob.findUnique({ where: { id: pushResult.jobId } });
      expect(job?.status).toBe('SUCCESS');
    });

    it('should support sync retry on failed jobs', async () => {
      const failedJob = await prisma.syncJob.findFirst({ where: { status: 'FAILED' } });
      if (failedJob) {
        const retryResult = await SyncService.retryJob(failedJob.id, 'test-user-id', 'Test User');
        expect(retryResult.success).toBe(true);
      }
    });
  });
});
