import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { SyncService } from '../services/syncService.js';

export class SyncController {
  static async pushProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await SyncService.pushProduct(id, req.user?.id, req.user?.name);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async pushBulk(req: AuthRequest, res: Response) {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: 'Array of productIds is required.' });
      }

      const result = await SyncService.pushBulk(productIds, req.user?.id, req.user?.name);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async pullProducts(req: AuthRequest, res: Response) {
    try {
      const result = await SyncService.pullProducts(req.user?.id, req.user?.name);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listJobs(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      const status = req.query.status as string;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const total = await prisma.syncJob.count({ where });
      const jobs = await prisma.syncJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return res.json({
        jobs: jobs.map(j => ({
          ...j,
          details: j.details ? JSON.parse(j.details) : null,
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

  static async getJob(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const job = await prisma.syncJob.findUnique({ where: { id } });
      if (!job) return res.status(404).json({ error: 'Sync job not found.' });

      return res.json({
        ...job,
        details: job.details ? JSON.parse(job.details) : null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async retryJob(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await SyncService.retryJob(id, req.user?.id, req.user?.name);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listConflicts(req: AuthRequest, res: Response) {
    try {
      const conflicts = await prisma.conflictLog.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
      });

      // Enrich with product information
      const enriched = await Promise.all(
        conflicts.map(async c => {
          const product = await prisma.product.findUnique({ where: { id: c.productId } });
          return {
            ...c,
            localData: JSON.parse(c.localData),
            remoteData: JSON.parse(c.remoteData),
            fieldDifferences: JSON.parse(c.fieldDifferences),
            productName: product?.name || 'Unknown Product',
            productSku: product?.sku || 'Unknown SKU',
          };
        })
      );

      return res.json(enriched);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async resolveConflict(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { resolution, mergedData } = req.body; // 'KEEP_LOCAL', 'KEEP_REMOTE', 'MERGE'

      if (!['KEEP_LOCAL', 'KEEP_REMOTE', 'MERGE'].includes(resolution)) {
        return res.status(400).json({ error: 'Valid resolution type is required (KEEP_LOCAL, KEEP_REMOTE, MERGE).' });
      }

      const result = await SyncService.resolveConflict(
        id,
        resolution,
        mergedData,
        req.user?.id,
        req.user?.name
      );

      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
