import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import path from 'path';
import config from './config';
import studentRoutes from './routes/student.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { getTenantSequelize, globalSequelize } from './db';

const app = express();
const server = createServer(app);

// Export for model usage
export { getTenantSequelize };

// Middleware
app.use(json());
app.use(tenantMiddleware);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/student', studentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// DB connection check endpoint
app.get('/db-check', async (_req, res) => {
    try {
        await globalSequelize.authenticate();
        res.json({ status: 1, message: 'Connected to ShikshaPrime MySQL successfully', host: config.db.host, database: config.db.name });
    } catch (err: any) {
        res.status(500).json({ status: 0, message: 'Database connection failed', error: err.message });
    }
});

// Error handling middleware
app.use(errorMiddleware);

// Start the server
const PORT = config.port || 9051;
server.listen(PORT, () => {
    console.log(`Student service is running on http://localhost:${PORT}`);
});