import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
});

// Wraps multer.single() so MulterError and fileFilter errors become ApiErrors
export const handleAssignmentUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  upload.single('assignmentFile')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(400, 'File size exceeds 25 MB limit'));
        return;
      }
      next(new ApiError(400, err.message));
      return;
    }
    if (err instanceof Error) {
      next(new ApiError(400, err.message));
      return;
    }
    next();
  });
};

// Optional upload (for teacher assignment creation with optional attachment)
export const handleOptionalAssignmentUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  upload.single('assignmentFile')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code !== 'LIMIT_UNEXPECTED_FILE') {
      next(new ApiError(400, err.message));
      return;
    }
    if (err instanceof Error) {
      next(new ApiError(400, err.message));
      return;
    }
    next();
  });
};
