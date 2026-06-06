import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import * as assignmentController from '../controllers/assignment.controller';
import * as repositoryController from '../controllers/repository.controller';
import { requireAuth } from '../middleware/auth-middleware';
import { handleAssignmentUpload } from '../middleware/upload.middleware';

const router = Router();

// ── Search ────────────────────────────────────────────────────────────────
router.get('/search', requireAuth, studentController.searchStudents);

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

// ── Repository ────────────────────────────────────────────────────────────
// /files/:fileId/download must be declared BEFORE /files/:fileId to avoid shadowing
router.get('/repository/categories', requireAuth, repositoryController.getCategories);
router.get('/repository/categories/:categoryId/files', requireAuth, repositoryController.getFilesByCategory);
router.get('/repository/files/:fileId/download', requireAuth, repositoryController.downloadFile);
router.get('/repository/files/:fileId', requireAuth, repositoryController.getFileById);

export default router;
