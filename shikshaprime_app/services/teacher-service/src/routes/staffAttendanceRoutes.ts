import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import {
  markStaffAttendance,
  bulkMarkStaffAttendance,
  getStaffAttendanceSummary,
  getStaffAttendanceReport,
  getEmployeeAttendance,
  deleteStaffAttendance,
  getStaffAttendanceStats,
} from "../controllers/staffAttendanceController";

const router = Router();

// All routes require authentication and admin role
router.use(requireAuth);

// Get attendance stats (for dashboard widgets)
router.get("/stats", requireRole("admin"), getStaffAttendanceStats);

// Get attendance summary with aggregated data
router.get("/summary", requireRole("admin"), getStaffAttendanceSummary);

// Get attendance report for PDF generation
router.get("/report", requireRole("admin"), getStaffAttendanceReport);

// Get attendance for a specific employee
router.get("/employee/:employeeId", requireRole("admin"), getEmployeeAttendance);

// Mark attendance for a single staff member
router.post("/", requireRole("admin"), markStaffAttendance);

// Bulk mark attendance for multiple staff members
router.post("/bulk", requireRole("admin"), bulkMarkStaffAttendance);

// Delete attendance record
router.delete("/:attendanceId", requireRole("admin"), deleteStaffAttendance);

export default router;
