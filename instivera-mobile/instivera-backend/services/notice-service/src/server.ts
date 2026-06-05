import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import config from './config';
import noticeRoutes from './routes/notice.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { getTenantSequelize } from './db';

const app = express();
const server = createServer(app);

export { getTenantSequelize };

app.use(json());
app.use(tenantMiddleware);

app.use('/notices', noticeRoutes);

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.use(errorMiddleware);

const PORT = config.port || 9057;
server.listen(PORT, () => {
  console.log(`Notice service is running on http://localhost:${PORT}`);
});
