import { NextFunction, Response } from "express";
import { AdminDashboardService } from "../services/adminDashboardService";

const adminDashboardService = new AdminDashboardService();

export async function getAdminDashboard(req: any, res: Response, next: NextFunction) {
  try {
    const departmentId =
      req.query.departmentId !== undefined && req.query.departmentId !== ""
        ? Number(req.query.departmentId)
        : req.query.streamId !== undefined && req.query.streamId !== ""
        ? Number(req.query.streamId)
        : undefined;
    const programId =
      req.query.programId !== undefined && req.query.programId !== ""
        ? Number(req.query.programId)
        : undefined;
    const semesterId =
      req.query.semesterId !== undefined && req.query.semesterId !== ""
        ? Number(req.query.semesterId)
        : undefined;
    const academicYearId =
      req.query.academicYearId !== undefined && req.query.academicYearId !== ""
        ? Number(req.query.academicYearId)
        : undefined;
    const attendanceYear =
      req.query.attendanceYear !== undefined && req.query.attendanceYear !== ""
        ? Number(req.query.attendanceYear)
        : undefined;
    const earningsAcademicYearId =
      req.query.earningsAcademicYearId !== undefined && req.query.earningsAcademicYearId !== ""
        ? Number(req.query.earningsAcademicYearId)
        : undefined;
    const earningsYear =
      req.query.earningsYear !== undefined && req.query.earningsYear !== ""
        ? Number(req.query.earningsYear)
        : undefined;

    const data = await adminDashboardService.getDashboardData({
      tenant: req.tenant,
      departmentId,
      programId,
      semesterId,
      academicYearId,
      earningsAcademicYearId,
      attendanceYear,
      earningsYear,
    });

    return res.status(200).json({
      status: 1,
      message: "Admin dashboard data fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
