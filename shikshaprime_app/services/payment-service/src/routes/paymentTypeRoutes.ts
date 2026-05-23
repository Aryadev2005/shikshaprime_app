import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getAllPaymentTypes,
  getActivePaymentTypes,
  getPaymentTypeById,
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
  togglePaymentTypeStatus,
} from "../controllers/paymentTypeController";
import { getPublicPaymentTypes } from "../controllers/publicPaymentController";

const router = Router();

// Get all payment types
router.get("/", requireAuth, getAllPaymentTypes);

// Public payment types for standalone student payment flow
router.get("/public", getPublicPaymentTypes);

// Get active payment types only
router.get("/active", requireAuth, getActivePaymentTypes);

// Get payment type by ID
router.get("/:id", requireAuth, getPaymentTypeById);

// Create payment type
router.post("/", requireAuth, createPaymentType);

// Update payment type
router.put("/:id", requireAuth, updatePaymentType);

// Delete payment type
router.delete("/:id", requireAuth, deletePaymentType);

// Toggle payment type status
router.patch("/:id/toggle", requireAuth, togglePaymentTypeStatus);

export default router;
