import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import config from './config';
import noticeRoutes from './routes/notice.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { getTenantSequelize, globalSequelize } from './db';

const app = express();
const server = createServer(app);

export { getTenantSequelize };

app.use(json());
app.use(tenantMiddleware);

app.use('/notices', noticeRoutes);

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
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

const PORT = config.port || 9057;
server.listen(PORT, () => {
  console.log(`Notice service is running on http://localhost:${PORT}`);
});
