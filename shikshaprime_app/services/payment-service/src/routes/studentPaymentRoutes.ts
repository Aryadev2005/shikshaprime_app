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
} from "../controllers/studentPaymentController";
import { 
  lookupPublicStudentPayment, 
  initiatePublicStudentPayment, 
  reconcilePublicPaymentCallback 
} from "../controllers/publicPaymentController";

const router = Router();

// Assign payment to students
router.post("/assign", requireAuth, assignPayment);

// Get student payments (with filters)
router.get("/", requireAuth, getStudentPayments);

// Public lookup for standalone student payment flow
router.get("/public-lookup", lookupPublicStudentPayment);
router.post("/public/initiate", initiatePublicStudentPayment);
router.get("/public/callback-status", reconcilePublicPaymentCallback);

// Initiate payment with gateway
router.post("/:paymentId/initiate", requireAuth, initiatePaymentGateway);

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
