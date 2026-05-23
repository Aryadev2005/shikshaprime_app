import { Router, Response } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { getTenantBreaker } from "../breakers/dbBreaker";
import { requireRole } from "../middleware/roleMiddleware";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadAssignmentFile } from "../middleware/uploadMiddleware";
import {
  createStudent,
  getStudents,
  getStudentById,
  getStudentCoreProfile,
  getStudentContact,
  getStudentAcademics,
  getMyStudentProfile,
  getMyStudentContact,
  getMyStudentAcademics,
  getMyStudentDetails,
  getMyStudentDashboard,
  getStudentByStudentId,
  updateStudent,
  deleteStudent,
  getStudentsByDepartment,
  getStudentsByClass,
  getStudentsByAcademicYear,
  searchStudents,
  getStudentStats,
  getStudentDetailsByEmail,
  lookupStudentForPayment,
} from "../controllers/studentController";
import { markAttendance, uploadAttendanceFile, getStudentAttendanceSummary, bulkMarkAttendance, getMyAttendanceRecords } from "../controllers/attendanceController";
import { getAttendanceReport } from "../controllers/pdfController";
import { getFilteredAssignments, getStudentAssignmentsAndStats, submitAssignment, serveAssignmentFile, getSubmittedAssignmentById, getAssignmentById } from "../controllers/assignmentController";

const router = Router();

// Ensure uploads/attendance directory exists
const attendanceUploadDir = path.join(process.cwd(), "uploads", "attendance");
if (!fs.existsSync(attendanceUploadDir)) {
  fs.mkdirSync(attendanceUploadDir, { recursive: true });
  console.log("[Routes] Created uploads/attendance directory");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attendanceUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for attendance images
  fileFilter: (req: any, file: any, cb: any) => {
    // Only allow image files for attendance
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only image files are allowed.`));
    }
  }
});

// Middleware to handle multer errors
const handleMulterError = (err: any, req: any, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 0,
        data: null,
        message: 'File too large. Maximum size is 50MB.'
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 0,
        data: null,
        message: 'Only one file allowed per upload'
      });
    } else {
      return res.status(400).json({
        status: 0,
        data: null,
        message: `Upload error: ${err.message}`
      });
    }
  } else if (err) {
    return res.status(400).json({
      status: 0,
      data: null,
      message: err.message || 'Upload failed'
    });
  }
  next();
};

// Student routes
router.post("/create", requireAuth, requireRole("admin"), createStudent);
router.get("/", requireAuth, getStudents);

// Student filtering and search routes (MUST be before /:id to avoid matching)
router.get("/search", requireAuth, searchStudents);
router.get("/statistics", requireAuth, requireRole("admin"), getStudentStats);
router.get("/payment-lookup", lookupStudentForPayment);
router.get("/by-student-id/:student_id", requireAuth, getStudentByStudentId);
router.get("/by-department/:department_id", requireAuth, getStudentsByDepartment);
router.get("/by-class", requireAuth, getStudentsByClass);
router.get("/by-academic-year/:academic_year_id", requireAuth, getStudentsByAcademicYear);
router.get("/details", requireAuth, getStudentDetailsByEmail);
router.get("/me", requireAuth, requireRole("student"), getMyStudentProfile);
router.get("/me/contact", requireAuth, requireRole("student"), getMyStudentContact);
router.get("/me/academics", requireAuth, requireRole("student"), getMyStudentAcademics);
router.get("/me/details", requireAuth, requireRole("student"), getMyStudentDetails);
router.get("/me/dashboard", requireAuth, requireRole("student"), getMyStudentDashboard);
router.get("/:id/contact", requireAuth, getStudentContact);
router.get("/:id/academics", requireAuth, getStudentAcademics);
router.get("/:id/profile", requireAuth, getStudentCoreProfile);

// Dynamic :id routes MUST come after specific routes
router.get("/:id", requireAuth, getStudentById);
router.put("/:id", requireAuth, requireRole("admin"), updateStudent);
router.patch("/:id", requireAuth, requireRole("admin", "teacher"), updateStudent);
router.delete("/:id", requireAuth, requireRole("admin"), deleteStudent);

// Attendance routes
router.post("/attendance", markAttendance);
router.post("/attendance/bulk", bulkMarkAttendance);
router.post("/attendance/upload", upload.single("file"), handleMulterError, uploadAttendanceFile);
router.get("/attendance/report", getAttendanceReport);
router.get("/attendance/summary", getStudentAttendanceSummary);
router.get("/attendance/my-records", requireAuth, requireRole("student"), getMyAttendanceRecords);

//assignment routes
router.get("/assignments/stats", requireAuth, requireRole("student"), getStudentAssignmentsAndStats);
router.get("/assignments/filter", requireAuth, requireRole("student"), getFilteredAssignments);
router.post("/assignments/submit", requireAuth, requireRole("student"), uploadAssignmentFile, submitAssignment);
router.get("/assignments/submitted/:id", requireAuth, requireRole("student"), getSubmittedAssignmentById);
router.get("/assignments/:id", requireAuth, requireRole("student"), getAssignmentById);

router.get("/ready/:tenant", async (req, res) => {
  const breaker = getTenantBreaker(req.params.tenant);
  const dbReady = await breaker.fire();
  if (dbReady) res.status(200).send("READY");
  else res.status(500).send("NOT READY");
});

export default router;
