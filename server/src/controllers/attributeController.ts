import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export class AttributeController {
  static async listAttributes(req: AuthRequest, res: Response) {
    try {
      const attributes = await prisma.attribute.findMany({
        orderBy: { name: 'asc' },
      });
      return res.json(attributes.map(a => ({
        ...a,
        options: JSON.parse(a.options || '[]'),
      })));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async createAttribute(req: AuthRequest, res: Response) {
    try {
      const { name, slug, options } = req.body;
      if (!name) return res.status(400).json({ error: 'Attribute name is required.' });

      const finalSlug = (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existing = await prisma.attribute.findUnique({ where: { slug: finalSlug } });
      if (existing) {
        return res.status(400).json({ error: `Attribute with slug "${finalSlug}" already exists.` });
      }

      const attribute = await prisma.attribute.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          options: JSON.stringify(Array.isArray(options) ? options : []),
        },
      });

      return res.status(201).json({
        ...attribute,
        options: JSON.parse(attribute.options),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateAttribute(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, options } = req.body;

      const existing = await prisma.attribute.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Attribute not found.' });

      const finalSlug = slug
        ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : existing.slug;

      const updated = await prisma.attribute.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : existing.name,
          slug: finalSlug,
          options: options !== undefined ? JSON.stringify(options) : existing.options,
        },
      });

      return res.json({
        ...updated,
        options: JSON.parse(updated.options),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async deleteAttribute(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const existing = await prisma.attribute.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Attribute not found.' });

      await prisma.attribute.delete({ where: { id } });
      return res.json({ success: true, message: `Attribute "${existing.name}" deleted.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
