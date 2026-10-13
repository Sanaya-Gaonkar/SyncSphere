import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { WooCommerceService } from '../services/wooService.js';

export class SettingsController {
  static async getSettings(req: AuthRequest, res: Response) {
    try {
      let settings = await prisma.settings.findUnique({ where: { id: 'default' } });
      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            id: 'default',
            storeUrl: 'https://demo-store.woocommerce.com',
            consumerKey: 'ck_demo_9876543210abcdef9876543210abcdef98765432',
            consumerSecret: 'cs_demo_1234567890abcdef1234567890abcdef12345678',
            apiVersion: 'wc/v3',
            verifySsl: true,
            isDemoMode: true,
            autoSyncOnSave: false,
          },
        });
      }

      // Mask consumer secret for security
      const maskedSecret = settings.consumerSecret
        ? `${settings.consumerSecret.substring(0, 7)}••••••••••••••••${settings.consumerSecret.slice(-4)}`
        : '';

      return res.json({
        ...settings,
        consumerSecretMasked: maskedSecret,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateSettings(req: AuthRequest, res: Response) {
    try {
      const {
        storeUrl,
        consumerKey,
        consumerSecret,
        apiVersion,
        verifySsl,
        isDemoMode,
        autoSyncOnSave,
        webhookSecret,
      } = req.body;

      const dataToUpdate: any = {};
      if (storeUrl !== undefined) dataToUpdate.storeUrl = storeUrl.trim();
      if (consumerKey !== undefined) dataToUpdate.consumerKey = consumerKey.trim();
      if (consumerSecret !== undefined && !consumerSecret.includes('••••')) {
        dataToUpdate.consumerSecret = consumerSecret.trim();
      }
      if (apiVersion !== undefined) dataToUpdate.apiVersion = apiVersion;
      if (verifySsl !== undefined) dataToUpdate.verifySsl = !!verifySsl;
      if (isDemoMode !== undefined) dataToUpdate.isDemoMode = !!isDemoMode;
      if (autoSyncOnSave !== undefined) dataToUpdate.autoSyncOnSave = !!autoSyncOnSave;
      if (webhookSecret !== undefined) dataToUpdate.webhookSecret = webhookSecret.trim();

      const updated = await prisma.settings.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          ...dataToUpdate,
        },
        update: dataToUpdate,
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user?.name || 'Admin',
          action: 'SETTINGS_UPDATED',
          entityType: 'SETTINGS',
          details: JSON.stringify({
            storeUrl: updated.storeUrl,
            isDemoMode: updated.isDemoMode,
            apiVersion: updated.apiVersion,
          }),
        },
      });

      const maskedSecret = updated.consumerSecret
        ? `${updated.consumerSecret.substring(0, 7)}••••••••••••••••${updated.consumerSecret.slice(-4)}`
        : '';

      return res.json({
        ...updated,
        consumerSecretMasked: maskedSecret,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async testConnection(req: AuthRequest, res: Response) {
    try {
      const { storeUrl, consumerKey, consumerSecret, isDemoMode } = req.body;
      const testResult = await WooCommerceService.testConnection({
        storeUrl,
        consumerKey,
        consumerSecret: consumerSecret && !consumerSecret.includes('••••') ? consumerSecret : undefined,
        isDemoMode,
      });
      return res.json(testResult);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Connection test failed.',
      });
    }
  }
}
