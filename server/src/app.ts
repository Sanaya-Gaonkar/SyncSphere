import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import attributeRoutes from './routes/attributeRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import csvRoutes from './routes/csvRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

// Capture raw body for webhook verification
app.use(express.json({
  limit: '15mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf-8');
  },
}));

app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'SyncSphere PIM API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/audit', auditRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

export default app;
