
import { Router } from "express";
import { makeLogin, validateEmail, changePassword, sendEmailOtp, verifyEmailOtp } from "../controllers/authController";
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
  registerStudent,
  adminRegisterStudent,
  listRegistrations,
  getRegistrationById,
  updateRegistrationStatus,
  bulkUpdateRegistrationStatus,
  getRegistrationByRegId,
  initiatePayment,
  verifyPayment,
  paymentCallback,
  getPaymentReceipt,
  getRegistrationByRegIdAdmin,
  resendPaymentNotification,
  getPrograms,
  getProgramSubjects,
  getDepartmentsLevelTwo,
  getSemesters
} from "../controllers/studentRegistrationController";
import { getTeacherClasses, getAllClasses, getTeacherPrgrams, getTeacherAcademicYears } from "../controllers/teacherController";
import { NoticeController } from "../controllers/noticeController";
import { getAdminDashboard } from "../controllers/adminDashboardController";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'storage', 'documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
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
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/change-password", changePassword);
router.get("/sr/academic-years", getAcademicYears);
router.get("/sr/classes", getClasses);
router.get("/sr/departments", getDepartments);
router.get("/sr/departments/level-2", getDepartmentsLevelTwo);
router.get("/sr/programs", getPrograms);
router.get("/sr/programs/subjects", getProgramSubjects);
router.get("/sr/programs/classes/semesters", getSemesters);
router.get("/sr/fee-structure", getFeeStructure);
router.post("/sr/register",
  upload.fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'birth_certificate', maxCount: 1 },
    { name: '10_mark_sheet', maxCount: 1 },
    { name: '12_mark_sheet', maxCount: 1 },
    { name: 'graduation', maxCount: 1 },
    { name: 'caste_certificate', maxCount: 1 },
    { name: 'physically_challenged_certificate', maxCount: 1 },
    { name: 'profileImg', maxCount: 1 }
  ]),
  registerStudent);
router.get("/sr/registration/:regId", getRegistrationByRegId);
router.post("/sr/payments/initiate", initiatePayment);
router.post("/sr/payments/verify", verifyPayment);
router.get("/sr/registration/:regId", getRegistrationByRegId);
router.post("/sr/payments/initiate", initiatePayment);
router.post("/sr/payments/verify", verifyPayment);
router.post("/sr/payments/callback", paymentCallback);
router.get("/sr/payments/:id/receipt", getPaymentReceipt);
router.post("/sr/admin/register", requireAuth, requireRole("admin"), adminRegisterStudent);
router.get("/sr/admin/registrations", requireAuth, requireRole("admin"), listRegistrations);
router.get("/sr/admin/registrations/:id", requireAuth, requireRole("admin"), getRegistrationById); // get student data
router.patch("/sr/admin/registrations/:id/status", requireAuth, requireRole("admin"), updateRegistrationStatus);
router.post("/sr/admin/registrations/bulk-status", requireAuth, requireRole("admin"), bulkUpdateRegistrationStatus);
router.get("/sr/admin/registrations/by-reg-id/:regId", requireAuth, requireRole("admin"), getRegistrationByRegIdAdmin);
// Resend payment notification (email/SMS) for a registration
router.post("/sr/admin/registrations/resend/:registrationId", requireAuth, requireRole("admin"), resendPaymentNotification);

// File serving routes
router.get("/files/documents/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
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

