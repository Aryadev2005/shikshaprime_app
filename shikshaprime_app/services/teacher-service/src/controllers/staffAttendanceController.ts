import { Request, Response, NextFunction } from "express";
import staffAttendanceService from "../services/staffAttendanceService";
import { AppError } from "../utils/appError";

/**
 * Mark attendance for a single staff member
 */
export async function markStaffAttendance(req, res: Response, next: NextFunction) {
  try {
    const { employee_id, attendance_date, attendance_status } = req.body;

    if (!employee_id || !attendance_date || !attendance_status) {
      throw new AppError("employee_id, attendance_date, and attendance_status are required", 400);
    }

    const record = await staffAttendanceService.markAttendance(req.body, req.tenant);

    return res.status(201).json({
      status: 1,
      message: "Attendance marked successfully",
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk mark attendance for multiple staff members
 */
export async function bulkMarkStaffAttendance(req, res: Response, next: NextFunction) {
  try {
    const { date, staff, marked_by } = req.body;

    if (!date || !staff || !Array.isArray(staff) || staff.length === 0) {
      throw new AppError("date and staff array are required", 400);
    }

    const results = await staffAttendanceService.bulkMarkAttendance(
      date,
      staff.map((s: any) => ({
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        department_id: s.department_id,
        designation: s.designation,
        status: s.status,
      })),
      marked_by || "ADMIN",
      req.tenant
    );

    return res.status(200).json({
      status: 1,
      message: `Attendance processed: ${results.created} created, ${results.updated} updated`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance summary with stats
 */
export async function getStaffAttendanceSummary(req, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, department_id } = req.query;

    const summary = await staffAttendanceService.getAttendanceSummary({
      startDate: startDate as string,
      endDate: endDate as string,
      department_id: department_id ? Number(department_id) : undefined
    }, req.tenant);

    return res.status(200).json({
      status: 1,
      message: "Attendance summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance report for PDF generation
 */
export async function getStaffAttendanceReport(req, res: Response, next: NextFunction) {
  try {
    const { date, month, year, department_id } = req.query;

    const records = await staffAttendanceService.getAttendanceReport({
      date: date as string,
      month: month as string,
      year: year as string,
      department_id: department_id ? Number(department_id) : undefined      
    }, req.tenant);

    return res.status(200).json({
      status: 1,
      message: "Attendance report fetched successfully",
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance for a specific employee
 */
export async function getEmployeeAttendance(req, res: Response, next: NextFunction) {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!employeeId) {
      throw new AppError("Employee ID is required", 400);
    }

    const records = await staffAttendanceService.getEmployeeAttendance(String(employeeId), {
      startDate: startDate as string,
      endDate: endDate as string,
    }, req.tenant);

    return res.status(200).json({
      status: 1,
      message: "Employee attendance fetched successfully",
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete attendance record
 */
export async function deleteStaffAttendance(req, res: Response, next: NextFunction) {
  try {
    const { attendanceId } = req.params;

    if (!attendanceId) {
      throw new AppError("Attendance ID is required", 400);
    }

    const result = await staffAttendanceService.deleteAttendance(String(attendanceId), req.tenant);

    return res.status(200).json({
      status: 1,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance stats (counts for dashboard)
 */
export async function getStaffAttendanceStats(req, res: Response, next: NextFunction) {
  try {
    const { date } = req.query;

    const stats = await staffAttendanceService.getAttendanceStats(date as string, req.tenant);

    return res.status(200).json({
      status: 1,
      message: "Attendance stats fetched successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
