import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Protected routes
router.use(authMiddleware);
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);

export default router;