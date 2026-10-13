import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export class AuditController {
  static async listLogs(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const entityType = req.query.entityType as string;

      const where: any = {};
      if (entityType && entityType !== 'ALL') {
        where.entityType = entityType;
      }

      const total = await prisma.auditLog.count({ where });
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return res.json({
        logs: logs.map(l => ({
          ...l,
          details: l.details ? JSON.parse(l.details) : null,
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
}
