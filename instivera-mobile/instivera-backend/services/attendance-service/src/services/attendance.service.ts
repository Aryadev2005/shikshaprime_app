import { Request, Response } from 'express';
import { Attendance } from '../models/attendance.model';
import { sendSuccess, sendError } from '../utils/response';

export const createAttendance = async (req: Request, res: Response) => {
    try {
        const attendanceData = req.body;
        const attendance = await Attendance.create(attendanceData);
        sendSuccess(res, attendance);
    } catch (error) {
        sendError(res, error);
    }
};

export const getAttendance = async (req: Request, res: Response) => {
    try {
        const attendanceId = req.params.id;
        const attendance = await Attendance.findByPk(attendanceId);
        if (!attendance) {
            return sendError(res, 'Attendance not found', 404);
        }
        sendSuccess(res, attendance);
    } catch (error) {
        sendError(res, error);
    }
};

export const updateAttendance = async (req: Request, res: Response) => {
    try {
        const attendanceId = req.params.id;
        const attendanceData = req.body;
        const [updated] = await Attendance.update(attendanceData, {
            where: { id: attendanceId }
        });
        if (!updated) {
            return sendError(res, 'Attendance not found', 404);
        }
        const updatedAttendance = await Attendance.findByPk(attendanceId);
        sendSuccess(res, updatedAttendance);
    } catch (error) {
        sendError(res, error);
    }
};

export const deleteAttendance = async (req: Request, res: Response) => {
    try {
        const attendanceId = req.params.id;
        const deleted = await Attendance.destroy({
            where: { id: attendanceId }
        });
        if (!deleted) {
            return sendError(res, 'Attendance not found', 404);
        }
        sendSuccess(res, { message: 'Attendance deleted successfully' });
    } catch (error) {
        sendError(res, error);
    }
};