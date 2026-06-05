import { Request, Response } from 'express';
import AttendanceService from '../services/attendance.service';

class AttendanceController {
    async getAttendance(req: Request, res: Response) {
        try {
            const attendanceData = await AttendanceService.getAttendance(req.params.studentId);
            res.status(200).json(attendanceData);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving attendance data', error });
        }
    }

    async markAttendance(req: Request, res: Response) {
        try {
            const { studentId, classId } = req.body;
            const result = await AttendanceService.markAttendance(studentId, classId);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Error marking attendance', error });
        }
    }

    async updateAttendance(req: Request, res: Response) {
        try {
            const { attendanceId, status } = req.body;
            const result = await AttendanceService.updateAttendance(attendanceId, status);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Error updating attendance', error });
        }
    }
}

export default new AttendanceController();