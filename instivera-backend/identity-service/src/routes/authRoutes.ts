
import { Router } from "express";
import { makeLogin, validateEmail, changePassword, sendEmailOtp, verifyEmailOtp, userSendEmailOtp } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";
import { getTenantBreaker } from "../breakers/dbBreaker";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireRole } from "../middleware/roleMiddleware";

import {
  getAcademicYears,
  getClasses,
  getDepartments,
  getFeeStructure,
  getPrograms,
  getProgramSubjects,
  getDepartmentsLevelTwo,
  getSemesters,
  getProgramSemesters
} from "../controllers/studentRegistrationController";
import { getTeacherClasses, getAllClasses, getTeacherPrgrams, getTeacherAcademicYears } from "../controllers/teacherController";
import { NoticeController } from "../controllers/noticeController";
import { getAdminDashboard } from "../controllers/adminDashboardController";

// Create uploads directory if it doesn't exist
// PREVIOUS CODE (Caused relative path issues):
// const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "files");

// RECTIFIED CODE:
const rawUploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "files");
const uploadsDir = path.isAbsolute(rawUploadsDir) ? rawUploadsDir : path.resolve(process.cwd(), rawUploadsDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG allowed.'));
    }
  }
});

const router = Router();
router.post("/authenticate-user", makeLogin);
router.post("/validate-email", validateEmail);
router.post("/send-email-otp", sendEmailOtp);
router.post("/user-send-email-otp", userSendEmailOtp)
router.post("/verify-email-otp", verifyEmailOtp);
// SECURITY: requireAuth is load-bearing. Without it this endpoint accepted an
// arbitrary { email, newPassword } from anyone and rewrote that user's password
// — unauthenticated account takeover for any known email address.
router.post("/change-password", requireAuth, changePassword);
router.get("/sr/academic-years", getAcademicYears);
router.get("/sr/classes", getClasses);
router.get("/sr/departments", getDepartments);
router.get("/sr/departments/level-2", getDepartmentsLevelTwo);
router.get("/sr/programs", getPrograms);
router.get("/sr/programs/subjects", getProgramSubjects);
router.get("/sr/programs/classes/semesters", getSemesters);
router.get("/sr/programs/semesters", getProgramSemesters);
router.get("/sr/fee-structure", getFeeStructure);
// File serving routes
// PREVIOUS CODE (Caused 500 Internal Server Error due to unhandled relative path in res.sendFile):
// router.get("/files/documents/:filename", (req, res) => {
//   const filename = req.params.filename;
//   const filePath = path.join(uploadsDir, filename);
// 
//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: 'File not found' });
//   }
// 
//   res.sendFile(filePath);
// });

// RECTIFIED CODE:
router.get("/files/documents/:filename", (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.resolve(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: 0, error: 'File not found', message: 'File not found' });
    }

    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        console.error("[file-serve] res.sendFile error:", err);
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
});

// Teacher routes
router.get("/teacher/classes", requireAuth, requireRole("teacher"), getTeacherClasses);
router.get("/teacher/programs", requireAuth, requireRole("teacher"), getTeacherPrgrams);
router.get("/teacher/academic-years", requireAuth, requireRole("teacher"), getTeacherAcademicYears);
router.get("/teacher/all-classes", requireAuth, getAllClasses);
router.get("/dashboard/admin", requireAuth, requireRole("admin"), getAdminDashboard);

// route
router.get("/ready/:tenant", async (req, res) => {
  const breaker = getTenantBreaker(req.params.tenant);
  const dbReady = await breaker.fire();
  if (dbReady) res.status(200).send("READY");
  else res.status(500).send("NOT READY");
});
//Notice routes
router.get('/notice/all', requireAuth, NoticeController.getAllNotices);
router.get('/notice/recent', requireAuth, NoticeController.getRecentNotices);
router.get('/notice/:id', requireAuth, NoticeController.getNoticeById);
router.post('/notice/', requireAuth, requireRole("admin"), upload.single('noticeAttachment'), NoticeController.createNotice);
router.delete('/notice/:id', requireAuth, requireRole("admin"), NoticeController.deleteNotice);

export default router;

