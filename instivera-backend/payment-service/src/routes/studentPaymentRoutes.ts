import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  assignPayment,
  getStudentPayments,
  getPaymentById,
  recordPayment,
  deleteStudentPayment,
  initiatePaymentGateway,
  checkPaymentStatus,
  updatePaymentStatusAfterGateway,
  verifyStudentGatewayPayment,
  getStudentPaymentAssignments,
  getStudentPaymentsReports,
} from "../controllers/studentPaymentController";
import { 
  lookupPublicStudentPayment, 
  initiatePublicStudentPayment, 
  reconcilePublicPaymentCallback,
  verifyPublicRazorpayPayment,
} from "../controllers/publicPaymentController";

const router = Router();

// Assign payment to students
router.post("/assign", requireAuth, assignPayment);

// Get student payments (with filters)
router.get("/", requireAuth, getStudentPayments);
router.get("/reports", requireAuth, getStudentPaymentsReports);
router.get("/assignments", requireAuth, getStudentPaymentAssignments);

// Public lookup for standalone student payment flow
router.get("/public-lookup", lookupPublicStudentPayment);
router.post("/public/initiate", initiatePublicStudentPayment);
router.post("/public/verify", verifyPublicRazorpayPayment);
router.get("/public/callback-status", reconcilePublicPaymentCallback);

// Initiate payment with gateway
router.post("/:assignmentId/initiate", requireAuth, initiatePaymentGateway);
router.post("/:assignmentId/verify", requireAuth, verifyStudentGatewayPayment);

// Update payment status after successful gateway payment
router.put("/:paymentId/update-status", requireAuth, updatePaymentStatusAfterGateway);

// Check payment status
router.get("/:paymentId/status", requireAuth, checkPaymentStatus);

// Get payment by ID
router.get("/:paymentId", requireAuth, getPaymentById);

// Record payment / update payment status
router.post("/:paymentId/pay", requireAuth, recordPayment);

// Delete student payment
router.delete("/:paymentId", requireAuth, deleteStudentPayment);

export default router;
