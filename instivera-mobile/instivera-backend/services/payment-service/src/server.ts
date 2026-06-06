import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import config from './config';
import paymentRoutes from './routes/payment.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { requireAuth } from './middleware/auth-middleware';
import { getTenantSequelize, globalSequelize } from './db';
import * as paymentController from './controllers/payment.controller';
import { validateEnv } from './utils/validateEnv';

validateEnv(['JWT_SECRET', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USERNAME', 'DB_PASSWORD']);

const app = express();
const server = createServer(app);

export { getTenantSequelize };

app.use(json());
app.use(tenantMiddleware);

app.use('/payments', paymentRoutes);

// BFF-compatible routes (/students namespace the BFF uses)
app.get('/students', requireAuth, paymentController.listPaymentsFromToken);
app.post('/students/:paymentId/initiate', requireAuth, paymentController.initiatePayment);
app.get('/students/:paymentId/status', requireAuth, paymentController.getPaymentStatus);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 1, data: { service: 'payment-service', version: '1.0.0' }, message: 'OK' });
});

app.get('/db-check', async (_req, res) => {
  try {
    await globalSequelize.authenticate();
    res.json({ status: 1, message: 'Connected to ShikshaPrime MySQL successfully', host: config.db.host, database: config.db.name });
  } catch (err: any) {
    res.status(500).json({ status: 0, message: 'Database connection failed', error: err.message });
  }
});

app.use(errorMiddleware);

const PORT = config.port || 9053;
server.listen(PORT, () => {
  console.log(`[payment-service] Running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await globalSequelize.close();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await globalSequelize.close();
  process.exit(0);
});
