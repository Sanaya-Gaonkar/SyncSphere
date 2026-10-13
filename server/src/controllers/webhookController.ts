import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { calculateCompleteness } from '../utils/validation.js';

export class WebhookController {
  static async handleWebhook(req: Request, res: Response) {
    try {
      const topic = (req.headers['x-wc-webhook-topic'] as string) || 'product.updated';
      const signature = req.headers['x-wc-webhook-signature'] as string;
      const deliveryId = (req.headers['x-wc-webhook-delivery-id'] as string) || req.headers['x-wc-webhook-id'] as string;

      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
      const secret = settings?.webhookSecret || 'whsec_demo_syncsphere_supersecret2026';

      // Verify HMAC-SHA256 signature
      let signatureVerified = false;
      if (signature) {
        const computedSignature = crypto
          .createHmac('sha256', secret)
          .update(rawBody)
          .digest('base64');
        signatureVerified = crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(computedSignature)
        );
      } else if (settings?.isDemoMode) {
        // In demo mode without headers, treat as verified for simulation
        signatureVerified = true;
      }

      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Duplicate-event protection using deliveryId or payload hash
      const payloadHash = crypto.createHash('md5').update(rawBody).digest('hex');
      const existingEvent = await prisma.webhookEvent.findFirst({
        where: {
          OR: [
            ...(deliveryId ? [{ id: deliveryId }] : []),
            { payload: { contains: payloadHash } },
          ],
        },
      });

      if (existingEvent) {
        await prisma.webhookEvent.create({
          data: {
            id: deliveryId ? `${deliveryId}-dup-${Date.now()}` : undefined,
            eventName: topic,
            payload: JSON.stringify({ ...payload, _hash: payloadHash }),
            signature,
            signatureVerified,
            status: 'DUPLICATE',
          },
        });
        return res.status(200).json({ received: true, status: 'DUPLICATE', message: 'Event already processed.' });
      }

      // Process product update or delete
      if (topic === 'product.updated' || topic === 'product.created') {
        const sku = payload.sku || `WOO-${payload.id}`;
        const existing = await prisma.product.findUnique({ where: { sku } });

        if (existing) {
          const completeness = calculateCompleteness({
            name: payload.name || existing.name,
            sku,
            regularPrice: parseFloat(payload.regular_price || existing.regularPrice),
            salePrice: payload.sale_price ? parseFloat(payload.sale_price) : null,
            stockQuantity: payload.stock_quantity ?? existing.stockQuantity,
          });

          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: payload.name || existing.name,
              regularPrice: parseFloat(payload.regular_price || existing.regularPrice),
              stockQuantity: payload.stock_quantity ?? existing.stockQuantity,
              completenessScore: completeness.score,
              lastSyncedAt: new Date(),
              syncStatus: 'IN_SYNC',
            },
          });
        }
      }

      const event = await prisma.webhookEvent.create({
        data: {
          id: deliveryId || undefined,
          eventName: topic,
          payload: JSON.stringify({ ...payload, _hash: payloadHash }),
          signature,
          signatureVerified,
          status: 'PROCESSED',
        },
      });

      return res.status(200).json({ received: true, eventId: event.id, verified: signatureVerified });
    } catch (err: any) {
      await prisma.webhookEvent.create({
        data: {
          eventName: 'unknown.error',
          payload: JSON.stringify(req.body || {}),
          status: 'FAILED',
          error: err.message,
        },
      });
      return res.status(500).json({ error: err.message });
    }
  }

  static async listEvents(req: AuthRequest, res: Response) {
    try {
      const events = await prisma.webhookEvent.findMany({
        take: 25,
        orderBy: { processedAt: 'desc' },
      });
      return res.json(events.map(e => ({
        ...e,
        payload: JSON.parse(e.payload || '{}'),
      })));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async simulateEvent(req: AuthRequest, res: Response) {
    try {
      const { topic, productSku, newPrice, newStock } = req.body;
      const targetSku = productSku || 'AUD-AP-001';

      const mockPayload = {
        id: Math.floor(1000 + Math.random() * 9000),
        name: 'AcousticPro Studio Headphones Wireless',
        sku: targetSku,
        regular_price: String(newPrice || '259.99'),
        stock_quantity: newStock !== undefined ? Number(newStock) : 42,
        stock_status: 'instock',
        simulated: true,
        timestamp: new Date().toISOString(),
      };

      const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
      const secret = settings?.webhookSecret || 'whsec_demo_syncsphere_supersecret2026';
      const rawBody = JSON.stringify(mockPayload);
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');

      const deliveryId = `sim-wh-${Date.now()}`;

      const event = await prisma.webhookEvent.create({
        data: {
          id: deliveryId,
          eventName: topic || 'product.updated',
          payload: rawBody,
          signature,
          signatureVerified: true,
          status: 'PROCESSED',
        },
      });

      // Apply update to local product if matches SKU
      const product = await prisma.product.findUnique({ where: { sku: targetSku } });
      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            regularPrice: parseFloat(mockPayload.regular_price),
            stockQuantity: mockPayload.stock_quantity,
            lastSyncedAt: new Date(),
            syncStatus: 'IN_SYNC',
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user?.name || 'System',
          action: 'WEBHOOK_SIMULATED',
          entityType: 'WEBHOOK',
          entityId: event.id,
          details: JSON.stringify({ topic: topic || 'product.updated', sku: targetSku }),
        },
      });

      return res.json({
        success: true,
        event: {
          ...event,
          payload: mockPayload,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
