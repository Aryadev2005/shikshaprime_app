import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import { config } from './config';
import { assignmentRoutes } from './routes/assignment.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { authMiddleware } from './middleware/auth-middleware';

const app = express();
const server = createServer(app);

// Middleware
app.use(json());
app.use(authMiddleware);

// Routes
app.use('/api/assignments', assignmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Error handling middleware
app.use(errorMiddleware);

// Start the server
const PORT = config.port || 9052;
server.listen(PORT, () => {
    console.log(`Assignment Service is running on http://localhost:${PORT}`);
});