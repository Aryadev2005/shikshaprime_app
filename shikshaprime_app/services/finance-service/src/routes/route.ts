import { Router } from "express";

import {
  createContraVoucher,
  createJournalVoucher,
  createManualVoucher,
  createPaymentVoucher,
  createReceiptVoucher,
  createVoucher,
  deleteVoucher,
  getVoucherById,
  listVouchers
} from "../controllers/voucherController";

import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

import {
  createLedger,
  getLedgerBalance,
  getLedgerById,
  listLedgers
} from "../controllers/ledgerController";

import { getCoaTree, listCoaGroups } from "../controllers/coaGroupsController";

import {
  createBankAccount,
  getBankAccountById,
  listBankAccounts,
  listBankBranches,
  listBanks
} from "../controllers/bankController";

import {
  getBalanceSheet,
  getBankBook,
  getCashBook,
  getDayBook,
  getIncomeExpenditure,
  getLedgerStatement,
  getTrialBalance
} from "../controllers/reportController";

import {
  getDashboardStats,
  getRecentTransactions
} from "../controllers/dashboardController";
import { auditTrail } from "../middleware/auditMiddleware";

const router = Router();

/* ============================================================
   VOUCHERS (CREATE + DELETE → auditTrail)
   ============================================================ */

router.get("/vouchers", requireAuth, listVouchers);

router.post(
  "/vouchers/create",
  requireAuth,
  requireRole("admin"),
  auditTrail("create", "vouchers"),
  createVoucher
);

router.get("/vouchers/:id", requireAuth, getVoucherById);

router.delete(
  "/vouchers/:id",
  requireAuth,
  auditTrail("delete", "vouchers"),
  deleteVoucher
);

router.post(
  "/vouchers/receipt",
  requireAuth,
  auditTrail("create", "vouchers_receipt"),
  createReceiptVoucher
);

router.post(
  "/vouchers/payment",
  requireAuth,
  auditTrail("create", "vouchers_payment"),
  createPaymentVoucher
);

router.post(
  "/vouchers/contra",
  requireAuth,
  auditTrail("create", "vouchers_contra"),
  createContraVoucher
);

router.post(
  "/vouchers/journal",
  requireAuth,
  auditTrail("create", "vouchers_journal"),
  createJournalVoucher
);

router.post(
  "/vouchers/manual",
  requireAuth,
  auditTrail("create", "vouchers_manual"),
  createManualVoucher
);

/* ============================================================
   LEDGERS (CREATE only → auditTrail)
   ============================================================ */

router.get("/ledgers", requireAuth, listLedgers);
router.get("/ledgers/:id", requireAuth, getLedgerById);
router.get("/ledgers/:id/balance", requireAuth, getLedgerBalance);

router.post(
  "/ledgers",
  requireAuth,
  auditTrail("create", "ledgers"),
  createLedger
);

/* ============================================================
   CHART OF ACCOUNTS (READ only → no audit)
   ============================================================ */

router.get("/chart-of-account-groups", listCoaGroups);
router.get("/chart-of-account-groups/tree", getCoaTree);

router.get("/banks", listBanks);
router.get("/bank-branches", listBankBranches);
router.get("/bank-accounts", listBankAccounts);

router.post(
  "/bank-accounts",
  auditTrail("create", "bank_accounts"),
  createBankAccount
);

router.get("/bank-accounts/:id", requireAuth, getBankAccountById);

/* ============================================================
   REPORTS (READ only → no audit)
   ============================================================ */

router.get("/reports/day-book", requireAuth, getDayBook);
router.get("/reports/ledger-statement", requireAuth, getLedgerStatement);
router.get("/reports/trial-balance", requireAuth, getTrialBalance);
router.get("/reports/income-expenditure", requireAuth, getIncomeExpenditure);
router.get("/reports/balance-sheet", requireAuth, getBalanceSheet);
router.get("/reports/cash-book", requireAuth, getCashBook);
router.get("/reports/bank-book", requireAuth, getBankBook);

router.get("/dashboard-stats", requireAuth, getDashboardStats);
router.get("/recent-transactions", requireAuth, getRecentTransactions);

export default router;