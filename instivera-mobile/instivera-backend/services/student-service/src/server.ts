import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import path from 'path';
import config from './config';
import studentRoutes from './routes/student.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { getTenantSequelize } from './db';

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

// Error handling middleware
app.use(errorMiddleware);

// Start the server
const PORT = config.port || 9051;
server.listen(PORT, () => {
    console.log(`Student service is running on http://localhost:${PORT}`);
});