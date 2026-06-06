import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, images, and Word documents are allowed'));
    }
  },
});

export const handleAssignmentUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('assignmentFile')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ status: 0, data: null, message: err.message });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ status: 0, data: null, message: err.message });
      return;
    }
    next();
  });
};

export const handleOptionalAssignmentUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('assignmentFile')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code !== 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ status: 0, data: null, message: err.message });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ status: 0, data: null, message: err.message });
      return;
    }
    next();
  });
};

export const fileUrl = (file?: Express.Multer.File): string | undefined => {
  if (!file) return undefined;
  return `/uploads/${file.filename}`;
};
