import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getProfile, getMyAttendance, getAttendanceSummary, searchStudents } from './student.controller';

const router = Router();
router.use(tenantMiddleware, requireAuth);

// Student-facing
router.get('/profile', requireRole('student'), getProfile);
router.get('/attendance', requireRole('student'), getMyAttendance);
router.get('/attendance/summary', requireRole('student'), getAttendanceSummary);

// Shared (teacher/admin can search students)
router.get('/search', requireRole('teacher', 'admin'), searchStudents);

export default router;
