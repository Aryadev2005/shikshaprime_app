import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/auth-middleware';
import config from '../config';
import {
  getCategories,
  getFilesByCategory,
  downloadFile,
} from '../controllers/repository.controller';

// Accepts Bearer token from Authorization header OR ?token= query param.
// Used only for the download endpoint so Linking.openURL works (browsers can't
// set Authorization headers).
const requireAuthOrQueryToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const headerToken = req.headers.authorization?.split(' ')[1];
  const queryToken = req.query.token as string | undefined;
  const token = headerToken || queryToken;

  if (!token) {
    res.status(401).json({ status: 0, data: null, message: 'Not authenticated' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = decoded;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ status: 0, data: null, message: 'Invalid or expired token' });
  }
};

export const createRepositoryRoutes = (): Router => {
  const router = Router();

  router.get(
    '/categories',
    requireAuth,
    requireRole('student'),
    getCategories,
  );

  router.get(
    '/categories/:categoryId/files',
    requireAuth,
    requireRole('student'),
    getFilesByCategory,
  );

  // Download endpoint: accepts token from query param for Linking.openURL support
  router.get(
    '/files/:fileId/download',
    requireAuthOrQueryToken,
    requireRole('student'),
    downloadFile,
  );

  return router;
};
