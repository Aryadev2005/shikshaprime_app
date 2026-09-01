import { Router } from "express";

import {
  collectFee,
  getReceipt,
  getStudentReceipts
} from "../controllers/feeCollectionController";

import {
  createFeeHead,
  createFeeParticular,
  getFeeHeads,
  getFeeParticulars
} from "../controllers/feeStructureController";

import {
  assignFeesToStudents,
  getStudentDues,
  searchStudent,
  searchStudentWithDues,
  updateDueStatus
} from "../controllers/feeAssignmentController";

import {
  processOnlinePayment,
  processOnlineRegistrationPayment
} from "../controllers/onlinePaymentController";

import {
  getDailyCollectionReport,
  getHeadwiseCollectionReport,
  getOutstandingDues,
  getStudentLedger
} from "../controllers/feeReportsController";

import { requireAuth } from "../middleware/authMiddleware";
import { auditTrail } from "../middleware/auditMiddleware";

const router = Router();

/* ============================================================
   FEE STRUCTURE (CREATE actions → no old_value needed)
   ============================================================ */
router.post(
  "/fee-heads",
  auditTrail("create", "fee_heads"),
  createFeeHead
);

router.get("/fee-heads", getFeeHeads);

router.post(
  "/fee-particulars",
  auditTrail("create", "fee_particulars"),
  createFeeParticular
);

router.get(
  "/fee-particulars/:program_id/:academic_year_id/:semester_id",
  getFeeParticulars
);

/* ============================================================
   FEE ASSIGNMENT
   ============================================================ */

// CREATE assignment (no old_value)
router.post(
  "/fee-assignment/assign",
  auditTrail("create", "student_fee_assignments"),
  assignFeesToStudents
);

// GET dues (no audit)
router.get("/dues/:student_id", getStudentDues);

// UPDATE due status → needs old_value
router.patch(
  "/dues/:id/status",  
  auditTrail("update", "student_fee_assignments"),
  updateDueStatus
);

// Search (no audit)
router.get("/search", searchStudent);
router.get("/search-with-dues", requireAuth, searchStudentWithDues);
// CREATE receipt (no old_value)
router.post(
  "/collect",
  requireAuth,
  auditTrail("create", "fee_receipts"),
  collectFee
);

// GET receipts (no audit)
router.get("/receipts/:receipt_id", getReceipt);
router.get("/receipts/student/:student_id", getStudentReceipts);
router.post(
  "/online/process",
  auditTrail("create", "online_payments"),
  processOnlinePayment
);

router.post(
  "/online/process-registration",  
  auditTrail("create", "online_registration_payments"),
  processOnlineRegistrationPayment
);
router.get("/reports/daily-collection", getDailyCollectionReport);
router.get("/reports/student-ledger", getStudentLedger);
router.get("/reports/headwise-collection", getHeadwiseCollectionReport);
router.get("/reports/outstanding-dues", getOutstandingDues);

export default router;
