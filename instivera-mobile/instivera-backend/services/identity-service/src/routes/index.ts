import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import institutionRoutes from './institution.routes';
import registrationRoutes from './registration.routes';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ status: 1, message: 'Identity service is healthy' });
});

/**
 * Mount all route modules under /api prefix
 */
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/institutions', institutionRoutes);
router.use('/sr', registrationRoutes);

export function setupRoutes(app: any) {
  app.use('/api', router);
}
