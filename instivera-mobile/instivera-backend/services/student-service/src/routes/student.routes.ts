import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import * as assignmentController from '../controllers/assignment.controller';
import { requireAuth } from '../middleware/auth-middleware';
import { handleAssignmentUpload } from '../middleware/upload.middleware';

const router = Router();

// ── Profile ───────────────────────────────────────────────────────────────
router.get('/profile/:studentId', requireAuth, studentController.getProfile);

// ── Attendance ────────────────────────────────────────────────────────────
router.get('/attendance/my-records', requireAuth, studentController.getMyAttendance);
router.get('/attendance/summary', requireAuth, studentController.getAttendanceSummary);

// ── Assignments ───────────────────────────────────────────────────────────
// /submit must be declared BEFORE /:id to avoid shadowing
router.post('/assignments/submit', requireAuth, handleAssignmentUpload, assignmentController.submitAssignment);

router.get('/assignments', requireAuth, assignmentController.listMyAssignments);
router.get('/assignments/:id', requireAuth, assignmentController.getAssignmentById);

export default router;
