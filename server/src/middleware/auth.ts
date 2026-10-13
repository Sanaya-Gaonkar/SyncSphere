import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'syncsphere_jwt_secure_key_2026';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Optional convenience header for quick-switching in demo/testing
  const demoRole = req.headers['x-demo-role'] as string;
  if (!token && demoRole) {
    req.user = {
      id: demoRole === 'ADMIN' ? 'demo-admin-id' : 'demo-editor-id',
      email: demoRole === 'ADMIN' ? 'admin@syncsphere.io' : 'editor@syncsphere.io',
      name: demoRole === 'ADMIN' ? 'Sanaya Gaonkar' : 'Catalog Editor',
      role: demoRole === 'ADMIN' ? 'ADMIN' : 'EDITOR',
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}
