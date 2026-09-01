import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getDashboardStats,
  getDefaulters,
  getClassWiseSummary,
} from "../controllers/dashboardController";

const router = Router();

// Get dashboard statistics
router.get("/stats", requireAuth, getDashboardStats);

// Get defaulters list
router.get("/defaulters", requireAuth, getDefaulters);

// Get class-wise summary
router.get("/class-summary", requireAuth, getClassWiseSummary);

export default router;
