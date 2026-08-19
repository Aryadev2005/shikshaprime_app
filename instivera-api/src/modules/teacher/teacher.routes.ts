import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import {
  getProfile, getMyClasses, getTimetable, searchTeachers,
  getClassStudents, bulkMarkAttendance, getClassSummary, getMyAttendance,
} from './teacher.controller';

const router = Router();
router.use(tenantMiddleware, requireAuth, requireRole('teacher', 'admin'));

// Teacher profile routes
router.get('/profile', getProfile);
router.get('/my-classes', getMyClasses);
router.get('/timetable', getTimetable);
router.get('/search', searchTeachers);
router.get('/my-attendance', getMyAttendance);

// Attendance management
router.get('/attendance/class/:classId/students', getClassStudents);
router.post('/attendance/class/:classId/mark', bulkMarkAttendance);
router.get('/attendance/class/:classId/summary', getClassSummary);

export default router;
