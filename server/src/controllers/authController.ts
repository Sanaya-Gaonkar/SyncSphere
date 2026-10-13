import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'syncsphere_jwt_secure_key_2026';

export class AuthController {
  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async demoLogin(req: AuthRequest, res: Response) {
    try {
      const { role } = req.body; // 'ADMIN' or 'EDITOR'
      const targetRole = role === 'EDITOR' ? 'EDITOR' : 'ADMIN';

      let user = await prisma.user.findFirst({ where: { role: targetRole } });
      if (!user) {
        // Fallback demo user
        const hashedPassword = await bcrypt.hash(targetRole.toLowerCase() + '123', 10);
        user = await prisma.user.create({
          data: {
            email: `${targetRole.toLowerCase()}@syncsphere.io`,
            password: hashedPassword,
            name: targetRole === 'ADMIN' ? 'Sanaya Gaonkar' : 'Catalog Editor',
            role: targetRole,
          },
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getCurrentUser(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    return res.json({ user: req.user });
  }
}
