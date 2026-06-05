import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import config from './config';
import feesRoutes from './routes/fees.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { getTenantSequelize } from './db';

const app = express();
const server = createServer(app);

export { getTenantSequelize };

app.use(json());
app.use(tenantMiddleware);

// Task-spec routes
app.use('/fees', feesRoutes);

// BFF-compatible alias routes mounted at root so the BFF paths resolve
app.use('/', feesRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 1, data: { service: 'fees-service', version: '1.0.0' }, message: 'OK' });
});

app.use(errorMiddleware);

const PORT = config.port || 9056;
server.listen(PORT, () => {
  console.log(`Fees service is running on http://localhost:${PORT}`);
});
