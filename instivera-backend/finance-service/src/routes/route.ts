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
  deleteLedger,
  getLedgerBalance,
  getLedgerById,
  listLedgers,
  listLedgersByType,
  updateLedger
} from "../controllers/ledgerController";

import { createChartOfAccountGroup, getCoaTree, listCoaGroups } from "../controllers/coaGroupsController";

import {
  createBank,
  createBankAccount,
  createBankBranch,
  getBankAccountById,
  listBankAccounts,
  listBankBranches,
  listBanks,
  listFinancialYears
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
import { getAuditLogs } from "../controllers/auditTrailController";

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
router.get("/ledgers/:type", requireAuth, listLedgersByType);
router.get("/ledgers/:id", requireAuth, getLedgerById);
router.get("/ledgers/:id/balance", requireAuth, getLedgerBalance);

router.post(
  "/ledgers",
  requireAuth,
  auditTrail("create", "ledgers"),
  createLedger
);

router.put(
  "/ledgers/:id",
  requireAuth,
  auditTrail("update", "ledgers"),
  updateLedger
);

router.delete(
  "/ledgers/:id",
  requireAuth,
  auditTrail("delete", "ledgers"),
  deleteLedger
);

/* ============================================================
   CHART OF ACCOUNTS (READ only → no audit)
   ============================================================ */

router.post(
  "/chart-of-account-groups",
  requireAuth,
  auditTrail("create", "chart-of-account-groups"),
  createChartOfAccountGroup
);

router.get("/chart-of-account-groups", listCoaGroups);
router.get("/chart-of-account-groups/tree", getCoaTree);

router.get("/banks", listBanks);
router.get("/bank-branches", listBankBranches);
router.get("/bank-accounts", listBankAccounts);

router.get("/financial-years", listFinancialYears);

router.post("/bank-accounts",  auditTrail("create", "bank_accounts"),  createBankAccount);
router.post("/banks",  auditTrail("create", "bank"),  createBank);
router.post("/bank-branches",  auditTrail("create", "bank_branch"),  createBankBranch);

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

//Audit Trail Logs
router.get("/audit-trail",  requireAuth,  getAuditLogs);

export default router;