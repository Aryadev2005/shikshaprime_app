import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
const attendanceUploadsDir = path.join(uploadDir, "attendance");
const assignmentUploadsDir = path.join(uploadDir, "assignment-submissions");

// ensure uploads folders exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(attendanceUploadsDir)) {
  fs.mkdirSync(attendanceUploadsDir, { recursive: true });
}

if (!fs.existsSync(assignmentUploadsDir)) {
  fs.mkdirSync(assignmentUploadsDir, { recursive: true });
}

// Storage for general uploads
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// Storage for attendance file uploads
const attendanceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attendanceUploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// Storage for assignment submissions
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original extension
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter for assignment submissions
const assignmentFileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types for assignment submissions
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    // Archives
    'application/zip',
    'application/rar',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`File type ${file.mimetype} not allowed. Supported types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, JPEG, PNG, GIF, SVG, WEBP, ZIP, RAR`);
    error.name = 'MulterError';
    cb(error, false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Multer configuration for attendance file uploads
export const uploadAttendanceFile = multer({
  storage: attendanceStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB for images
}).single('file');

// Multer configuration for assignment submissions
export const uploadAssignmentSubmission = multer({
  storage: assignmentStorage,
  fileFilter: assignmentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for assignments
    files: 1 // Only 1 file per submission
  }
});

// Middleware to handle single file upload for assignment submissions
export const uploadAssignmentFile = uploadAssignmentSubmission.single('assignmentFile');

export { assignmentUploadsDir };