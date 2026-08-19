import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { handleAssignmentUpload, handleOptionalAssignmentUpload } from '../../middleware/upload.middleware';
import {
  listMyAssignments, getStudentAssignmentById, submitAssignment,
  listAssignments, createAssignment, getTeacherAssignmentById,
  updateAssignment, gradeSubmission, getSubmissions, getMetadata,
} from './assignments.controller';

const router = Router();
router.use(tenantMiddleware, requireAuth);

// Student routes
router.get('/student/list', requireRole('student'), listMyAssignments);
router.get('/student/:id', requireRole('student'), getStudentAssignmentById);
router.post('/student/:id/submit', requireRole('student'), handleOptionalAssignmentUpload, submitAssignment);

// Teacher routes
router.get('/teacher/list', requireRole('teacher', 'admin'), listAssignments);
router.post('/teacher/create', requireRole('teacher', 'admin'), handleOptionalAssignmentUpload, createAssignment);
router.get('/teacher/metadata', requireRole('teacher', 'admin'), getMetadata);
router.get('/teacher/:id', requireRole('teacher', 'admin'), getTeacherAssignmentById);
router.put('/teacher/:id', requireRole('teacher', 'admin'), handleOptionalAssignmentUpload, updateAssignment);
router.get('/teacher/:id/submissions', requireRole('teacher', 'admin'), getSubmissions);
router.post('/teacher/submissions/:submissionId/grade', requireRole('teacher', 'admin'), gradeSubmission);

export default router;
