import { Router } from "express";
import { libraryController } from "../controllers/libraryController";
import {
  createClearanceValidator,
  createKohaSettingValidator,
  createPatronValidator,
  idParamValidator,
  paginationValidator,
  studentIdParamValidator,
  updateClearanceValidator,
  updateKohaSettingValidator,
  updatePatronValidator,
  patronIdParamValidator,
  issueBookValidator,
  checkoutIdParamValidator,
  placeHoldValidator,
  holdIdParamValidator,
  createKohaBorrowerValidator,
  updateKohaBorrowerValidator,
  kohaPatronIdParamValidator,
  emailParamValidator,
} from "../validators/libraryValidators";
import { validate } from "../middleware/validate";
import { requireRole } from "../middleware/roleMiddleware";

const router = Router();

// ── Student Status & Book Search ──────────────────────────────────────────
router.get("/students/:student_id/status", requireRole("STUDENT", "LIBRARIAN", "ADMIN"), studentIdParamValidator, validate, libraryController.getStudentStatus);
router.get("/students/:student_id/loans", requireRole("STUDENT", "LIBRARIAN", "ADMIN"), studentIdParamValidator, validate, libraryController.getStudentLoans);
router.get("/students/:student_id/fines", requireRole("STUDENT", "LIBRARIAN", "ADMIN"), studentIdParamValidator, validate, libraryController.getStudentFines);
router.get("/books/search", requireRole("STUDENT", "LIBRARIAN", "ADMIN"), paginationValidator, validate, libraryController.searchBooks);

// ── Koha Settings CRUD ───────────────────────────────────────────────────
router.get("/settings", requireRole("ADMIN"), paginationValidator, validate, libraryController.listSettings);
router.post("/settings", requireRole("ADMIN"), createKohaSettingValidator, validate, libraryController.createSetting);
router.get("/settings/:id", requireRole("ADMIN"), idParamValidator, validate, libraryController.getSetting);
router.put("/settings/:id", requireRole("ADMIN"), updateKohaSettingValidator, validate, libraryController.updateSetting);
router.delete("/settings/:id", requireRole("ADMIN"), idParamValidator, validate, libraryController.deleteSetting);

// ── Patron Mapping CRUD ──────────────────────────────────────────────────
router.get("/patrons", requireRole("ADMIN", "LIBRARIAN"), paginationValidator, validate, libraryController.listPatrons);
router.post("/patrons/auto-map", requireRole("ADMIN", "LIBRARIAN"), libraryController.autoMapPatrons);
router.post("/patrons", requireRole("ADMIN", "LIBRARIAN"), createPatronValidator, validate, libraryController.createPatron);
router.get("/patrons/:id", requireRole("ADMIN", "LIBRARIAN"), idParamValidator, validate, libraryController.getPatron);
router.get("/patrons/student/:student_id", requireRole("ADMIN", "LIBRARIAN"), studentIdParamValidator, validate, libraryController.getPatronByStudent);
router.put("/patrons/:id", requireRole("ADMIN", "LIBRARIAN"), updatePatronValidator, validate, libraryController.updatePatron);
router.put("/patrons/email/:email", requireRole("ADMIN", "LIBRARIAN"), [...emailParamValidator, ...updatePatronValidator.slice(1)], validate, libraryController.updatePatronByEmail);
router.delete("/patrons/:id", requireRole("ADMIN", "LIBRARIAN"), idParamValidator, validate, libraryController.deletePatron);

// ── Clearance Logs CRUD ──────────────────────────────────────────────────
router.get("/clearance-logs", requireRole("ADMIN", "LIBRARIAN"), paginationValidator, validate, libraryController.listClearances);
router.post("/clearance-logs/sync", requireRole("ADMIN", "LIBRARIAN"), libraryController.syncClearanceLogs);
router.post("/clearance-logs", requireRole("ADMIN", "LIBRARIAN"), createClearanceValidator, validate, libraryController.createClearance);
router.get("/clearance-logs/:id", requireRole("ADMIN", "LIBRARIAN"), idParamValidator, validate, libraryController.getClearance);
router.put("/clearance-logs/:id", requireRole("ADMIN", "LIBRARIAN"), updateClearanceValidator, validate, libraryController.updateClearance);
router.delete("/clearance-logs/:id", requireRole("ADMIN", "LIBRARIAN"), idParamValidator, validate, libraryController.deleteClearance);

// ── Circulation — Checkouts (NEW) ────────────────────────────────────────
router.get("/checkouts", requireRole("ADMIN", "LIBRARIAN"), paginationValidator, validate, libraryController.listCheckouts);
router.get("/checkouts/patron/:patron_id", requireRole("ADMIN", "LIBRARIAN"), patronIdParamValidator, validate, libraryController.getPatronCheckouts);
router.post("/checkouts", requireRole("ADMIN", "LIBRARIAN"), issueBookValidator, validate, libraryController.issueBook);
router.put("/checkouts/:id", requireRole("ADMIN", "LIBRARIAN"), checkoutIdParamValidator, validate, libraryController.renewCheckout);
router.delete("/checkouts/:id", requireRole("ADMIN", "LIBRARIAN"), checkoutIdParamValidator, validate, libraryController.returnBook);

// ── Holds / Reservations (NEW) ───────────────────────────────────────────
router.get("/holds", requireRole("ADMIN", "LIBRARIAN"), paginationValidator, validate, libraryController.listHolds);
router.get("/holds/patron/:patron_id", requireRole("ADMIN", "LIBRARIAN"), patronIdParamValidator, validate, libraryController.getPatronHolds);
router.post("/holds", requireRole("ADMIN", "LIBRARIAN"), placeHoldValidator, validate, libraryController.placeHold);
router.delete("/holds/:id", requireRole("ADMIN", "LIBRARIAN"), holdIdParamValidator, validate, libraryController.cancelHold);

// ── Koha Health (NEW) ────────────────────────────────────────────────────
router.get("/koha/health", libraryController.kohaHealth);

// ── Koha Patron Search (NEW) ─────────────────────────────────────────────
router.get("/koha/patrons/search", requireRole("ADMIN", "LIBRARIAN"), libraryController.searchKohaPatrons);

// ── Koha Borrowers — Direct CRUD (NEW) ────────────────────────────────
router.get("/koha/defaulters", requireRole("ADMIN", "LIBRARIAN"), paginationValidator, validate, libraryController.listDefaulters);
router.get("/koha/borrowers", requireRole("ADMIN", "LIBRARIAN"), paginationValidator, validate, libraryController.listKohaBorrowers);
router.get("/koha/borrowers/:patron_id", requireRole("ADMIN", "LIBRARIAN"), kohaPatronIdParamValidator, validate, libraryController.getKohaBorrower);
router.post("/koha/borrowers", requireRole("ADMIN", "LIBRARIAN"), createKohaBorrowerValidator, validate, libraryController.createKohaBorrower);
router.put("/koha/borrowers/:patron_id", requireRole("ADMIN", "LIBRARIAN"), [...kohaPatronIdParamValidator, ...updateKohaBorrowerValidator], validate, libraryController.updateKohaBorrower);
router.delete("/koha/borrowers/:patron_id", requireRole("ADMIN", "LIBRARIAN"), kohaPatronIdParamValidator, validate, libraryController.deleteKohaBorrower);

export default router;
