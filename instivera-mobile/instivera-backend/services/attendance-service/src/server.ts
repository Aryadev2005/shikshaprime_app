import express from 'express';
import { json } from 'body-parser';
import { createConnection } from './db';
import attendanceRoutes from './routes/attendance.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { authMiddleware } from './middleware/auth-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 9051;

// Middleware
app.use(json());
app.use(authMiddleware);
app.use(tenantMiddleware);

// Routes
app.use('/api/attendance', attendanceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Error handling middleware
app.use(errorMiddleware);

// Start the server
const startServer = async () => {
    try {
        await createConnection();
        app.listen(PORT, () => {
            logger.info(`Attendance service is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Error starting the server:', error);
        process.exit(1);
    }
};

startServer();