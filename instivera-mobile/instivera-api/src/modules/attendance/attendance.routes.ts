import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getMyRecords, getClassStudents, getClassSummary, bulkMark } from './attendance.controller';

const router = Router();

// tenantMiddleware is already applied upstream in app.ts mobileRouter

// Student: GET /api/mobile/attendance/my-records?month=X&year=Y
router.get('/my-records',     requireAuth, requireRole('student'),          getMyRecords);

// Teacher: GET /api/mobile/attendance/class-students?class_id=X
router.get('/class-students', requireAuth, requireRole('teacher', 'admin'), getClassStudents);

// Teacher: GET /api/mobile/attendance/summary?class_id=X&date=YYYY-MM-DD
router.get('/summary',        requireAuth, requireRole('teacher', 'admin'), getClassSummary);

// Teacher: POST /api/mobile/attendance/bulk-mark
router.post('/bulk-mark',     requireAuth, requireRole('teacher', 'admin'), bulkMark);

export default router;
