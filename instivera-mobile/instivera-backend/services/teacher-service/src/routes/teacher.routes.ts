import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller';
import * as attendanceController from '../controllers/attendance.controller';
import * as assignmentController from '../controllers/assignment.controller';
import { authMiddleware } from '../middleware/auth-middleware';
import {
  handleOptionalAssignmentUpload,
} from '../middleware/upload.middleware';

const router = Router();

// ── Profile & classes ─────────────────────────────────────────────────────
router.get('/profile/:teacherId', authMiddleware, teacherController.getProfile);
router.get('/classes', authMiddleware, teacherController.getMyClasses);

// ── Attendance ────────────────────────────────────────────────────────────
router.get('/attendance/class-students', authMiddleware, attendanceController.getClassStudents);
router.post('/attendance/bulk-mark', authMiddleware, attendanceController.bulkMarkAttendance);
router.get('/attendance/class-summary', authMiddleware, attendanceController.getClassSummary);
router.get('/attendance/my-records', authMiddleware, attendanceController.getMyAttendance);
router.get('/my-attendance', authMiddleware, attendanceController.getMyAttendance);

// ── Assignments ───────────────────────────────────────────────────────────
// IMPORTANT: /metadata and /grade/:id must be declared BEFORE /:id to
// prevent Express treating the literal segments as id captures.
router.get('/assignments/metadata', authMiddleware, assignmentController.getMetadata);
router.put('/assignments/grade/:submissionId', authMiddleware, assignmentController.gradeSubmission);

router.get('/assignments', authMiddleware, assignmentController.listAssignments);
router.post('/assignments', authMiddleware, handleOptionalAssignmentUpload, assignmentController.createAssignment);
router.get('/assignments/:id', authMiddleware, assignmentController.getAssignmentById);
router.put('/assignments/:id', authMiddleware, handleOptionalAssignmentUpload, assignmentController.updateAssignment);
router.get('/assignments/:id/submissions', authMiddleware, assignmentController.getSubmissions);

export default router;
