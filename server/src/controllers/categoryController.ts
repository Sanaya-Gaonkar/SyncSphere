import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export class CategoryController {
  static async listCategories(req: AuthRequest, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
      return res.json(categories);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async createCategory(req: AuthRequest, res: Response) {
    try {
      const { name, slug, description, parentId } = req.body;
      if (!name) return res.status(400).json({ error: 'Category name is required.' });

      const finalSlug = (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existing = await prisma.category.findUnique({ where: { slug: finalSlug } });
      if (existing) {
        return res.status(400).json({ error: `Category with slug "${finalSlug}" already exists.` });
      }

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          description: description || null,
          parentId: parentId || null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user?.name || 'System',
          action: 'CATEGORY_CREATED',
          entityType: 'CATEGORY',
          entityId: category.id,
          details: JSON.stringify({ name: category.name, slug: category.slug }),
        },
      });

      return res.status(201).json(category);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, description, parentId } = req.body;

      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Category not found.' });

      const finalSlug = slug
        ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : existing.slug;

      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : existing.name,
          slug: finalSlug,
          description: description !== undefined ? description : existing.description,
          parentId: parentId !== undefined ? parentId : existing.parentId,
        },
      });

      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Category not found.' });

      await prisma.category.delete({ where: { id } });
      return res.json({ success: true, message: `Category "${existing.name}" deleted.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
