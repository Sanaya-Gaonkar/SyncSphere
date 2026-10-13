import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { CSVService } from '../services/csvService.js';

export class CSVController {
  static async preview(req: AuthRequest, res: Response) {
    try {
      let csvContent = '';
      if (req.file) {
        csvContent = req.file.buffer.toString('utf-8');
      } else if (req.body.csvContent) {
        csvContent = req.body.csvContent;
      } else {
        return res.status(400).json({ error: 'No CSV file or CSV text content provided.' });
      }

      const result = CSVService.parseCSVText(csvContent);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async import(req: AuthRequest, res: Response) {
    try {
      const { rows, options } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'No rows provided to import.' });
      }

      const result = await CSVService.executeImport(
        rows,
        options || {},
        req.user?.id,
        req.user?.name
      );

      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async export(req: AuthRequest, res: Response) {
    try {
      const filters = {
        category: req.query.category as string,
        syncStatus: req.query.syncStatus as string,
      };

      const csvData = await CSVService.exportProductsCSV(filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="syncsphere_catalog_${Date.now()}.csv"`);
      return res.send(csvData);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async downloadTemplate(req: AuthRequest, res: Response) {
    try {
      const template = CSVService.getSampleTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="syncsphere_product_template.csv"');
      return res.send(template);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
