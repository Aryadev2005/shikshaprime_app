import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Disk storage — used for student/teacher assignment submissions
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const diskUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, images, and Word documents are allowed'));
  },
});

export const handleAssignmentUpload = (req: Request, res: Response, next: NextFunction): void => {
  diskUpload.single('assignmentFile')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      next(new AppError(err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds 10 MB limit' : err.message, 400));
      return;
    }
    if (err instanceof Error) { next(new AppError(err.message, 400)); return; }
    next();
  });
};

export const handleOptionalAssignmentUpload = (req: Request, res: Response, next: NextFunction): void => {
  diskUpload.single('assignmentFile')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code !== 'LIMIT_UNEXPECTED_FILE') {
      next(new AppError(err.message, 400)); return;
    }
    if (err instanceof Error) { next(new AppError(err.message, 400)); return; }
    next();
  });
};

export const fileUrl = (file?: Express.Multer.File): string | undefined => {
  if (!file) return undefined;
  return `/uploads/${file.filename}`;
};
