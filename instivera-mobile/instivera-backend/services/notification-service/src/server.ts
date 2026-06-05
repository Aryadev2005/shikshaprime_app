import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import { config } from './config';
import notificationRoutes from './routes/notification.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { authMiddleware } from './middleware/auth-middleware';

const app = express();
const server = createServer(app);

// Middleware
app.use(json());
app.use(authMiddleware);

// Routes
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Error handling middleware
app.use(errorMiddleware);

// Start the server
const PORT = config.port || 9057;
server.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`);
});