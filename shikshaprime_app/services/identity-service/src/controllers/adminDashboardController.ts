import { NextFunction, Response } from "express";
import { AdminDashboardService } from "../services/adminDashboardService";

const adminDashboardService = new AdminDashboardService();

export async function getAdminDashboard(req: any, res: Response, next: NextFunction) {
  try {
    const streamId =
      req.query.streamId !== undefined && req.query.streamId !== ""
        ? Number(req.query.streamId)
        : undefined;
    const attendanceYear =
      req.query.attendanceYear !== undefined && req.query.attendanceYear !== ""
        ? Number(req.query.attendanceYear)
        : undefined;
    const earningsYear =
      req.query.earningsYear !== undefined && req.query.earningsYear !== ""
        ? Number(req.query.earningsYear)
        : undefined;

    const data = await adminDashboardService.getDashboardData({
      tenant: req.tenant,
      streamId,
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
