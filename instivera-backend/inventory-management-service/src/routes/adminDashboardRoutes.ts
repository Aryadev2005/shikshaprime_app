import { Router } from "express";
import { getAdminDashboardData } from "../controllers/adminDashboardController";

const router = Router();

router.get("/admin/dashboard", getAdminDashboardData);

export default router;
