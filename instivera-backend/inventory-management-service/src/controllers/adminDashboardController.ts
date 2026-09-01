import { Request, Response, NextFunction } from "express";
import { AdminDashboardService } from "../services/adminDashboardService";

export const getAdminDashboardData = async (req: any, res: Response, next: NextFunction) => {
      try {
            const tenant = req.tenant;
            
            const dashboardData = await AdminDashboardService.getDashboardData(tenant);
            
            res.json({
                  status: "success",
                  message: "Inventory dashboard data fetched successfully",
                  data: dashboardData
            });
      } catch (error) {
            next(error);
      }
};
