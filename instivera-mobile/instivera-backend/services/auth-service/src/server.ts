import express from 'express';
import { json } from 'body-parser';
import { createConnection } from './db';
import { authRoutes } from './routes/auth.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 9050;

app.use(json());
app.use(tenantMiddleware);

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.use(errorMiddleware);

const startServer = async () => {
    try {
        await createConnection();
        app.listen(PORT, () => {
            logger.info(`Auth service is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Error starting the server:', error);
        process.exit(1);
    }
};

startServer();