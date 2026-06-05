import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();
const attendanceController = new AttendanceController();

// Route to get all attendance records
router.get('/', authMiddleware, attendanceController.getAllAttendanceRecords.bind(attendanceController));

// Route to get attendance record by ID
router.get('/:id', authMiddleware, attendanceController.getAttendanceRecordById.bind(attendanceController));

// Route to create a new attendance record
router.post('/', authMiddleware, attendanceController.createAttendanceRecord.bind(attendanceController));

// Route to update an attendance record
router.put('/:id', authMiddleware, attendanceController.updateAttendanceRecord.bind(attendanceController));

// Route to delete an attendance record
router.delete('/:id', authMiddleware, attendanceController.deleteAttendanceRecord.bind(attendanceController));

export default router;