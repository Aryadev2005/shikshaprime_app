import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import config from './config';
import paymentRoutes from './routes/payment.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { requireAuth } from './middleware/auth-middleware';
import { getTenantSequelize } from './db';
import * as paymentController from './controllers/payment.controller';

const app = express();
const server = createServer(app);

export { getTenantSequelize };

app.use(json());
app.use(tenantMiddleware);

// ── Task-spec routes ───────────────────────────────────────────────────────────
app.use('/payments', paymentRoutes);

// ── BFF-compatible routes (/students namespace the BFF uses) ─────────────────
// BFF calls:
//   GET  /students?status=PENDING               → list by token user
//   POST /students/:paymentId/initiate          → initiate
//   GET  /students/:paymentId/status            → status
app.get('/students', requireAuth, paymentController.listPaymentsFromToken);
app.post('/students/:paymentId/initiate', requireAuth, paymentController.initiatePayment);
app.get('/students/:paymentId/status', requireAuth, paymentController.getPaymentStatus);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 1, data: { service: 'payment-service', version: '1.0.0' }, message: 'OK' });
});

app.use(errorMiddleware);

const PORT = config.port || 9053;
server.listen(PORT, () => {
  console.log(`Payment service is running on http://localhost:${PORT}`);
});
