import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  startOrGetSession,
  getSessionStudents,
  submitSessionAttendance,
  getCorrectionSessions,
  getCorrectionSessionDetails,
  submitSessionAttendanceCorrection,
  correctSingleStudentAttendance,
  getTeacherSubjects,
  getTeacherSubjectStats,
} from "../controllers/sessionAttendanceController";

const router = Router();

// 1. Initialize or fetch an attendance session for a class routine entry
router.post("/start", requireAuth, startOrGetSession);

// 2. Fetch students for an attendance session
router.get("/students", requireAuth, getSessionStudents);

// 3. Bulk submit student attendance for a session
router.post("/submit", requireAuth, submitSessionAttendance);

// 4. Teacher Subject Statistics & Range Heatmap Routes
router.get("/teacher-subjects", requireAuth, getTeacherSubjects);
router.get("/teacher-subject-stats", requireAuth, getTeacherSubjectStats);

// 5. Attendance Correction Routes
router.get("/correction/sessions", requireAuth, getCorrectionSessions);
router.get("/correction/sessions/:attendanceSessionId", requireAuth, getCorrectionSessionDetails);
router.post("/correction/submit", requireAuth, submitSessionAttendanceCorrection);
router.patch("/correction/:studentAttendanceId", requireAuth, correctSingleStudentAttendance);

export default router;
