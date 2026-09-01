import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { crudService } from "../services/crudService";
import { libraryService } from "../services/libraryService";
import { circulationService } from "../services/circulationService";
import { holdsService } from "../services/holdsService";
import { kohaPatronService } from "../services/kohaPatronService";

export const libraryController = {
  // =====================================================================
  // Student Status & Book Search (existing, enhanced)
  // =====================================================================

  getStudentStatus: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const studentId = parseInt(String(req.params.student_id), 10);
    const data = await libraryService.getStudentLibraryStatus(tenant, studentId);
    res.json({ success: true, message: "Student library status fetched", data });
  }),

  getStudentLoans: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const studentId = parseInt(String(req.params.student_id), 10);
    const data = await libraryService.getStudentLoans(tenant, studentId);
    res.json({ success: true, message: "Student library loans fetched", data });
  }),

  getStudentFines: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const studentId = parseInt(String(req.params.student_id), 10);
    const data = await libraryService.getStudentFines(tenant, studentId);
    res.json({ success: true, message: "Student library fines fetched", data });
  }),

  searchBooks: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await libraryService.searchBooks(tenant, req.query);
    res.json({ success: true, message: "Books fetched", data });
  }),

  // =====================================================================
  // Koha Settings CRUD (existing)
  // =====================================================================

  listSettings: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.listSettings(tenant, Number(req.query.page || 1), Number(req.query.limit || 10));
    res.json({ success: true, message: "Settings fetched", data });
  }),

  createSetting: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.createSetting(tenant, req.body);
    res.status(201).json({ success: true, message: "Setting created", data });
  }),

  getSetting: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.getSetting(tenant, Number(req.params.id));
    res.json({ success: true, message: "Setting fetched", data });
  }),

  updateSetting: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.updateSetting(tenant, Number(req.params.id), req.body);
    res.json({ success: true, message: "Setting updated", data });
  }),

  deleteSetting: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    await crudService.deleteSetting(tenant, Number(req.params.id));
    res.json({ success: true, message: "Setting deleted", data: {} });
  }),

  // =====================================================================
  // Patron Mapping CRUD (existing)
  // =====================================================================

  listPatrons: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.listPatrons(tenant, Number(req.query.page || 1), Number(req.query.limit || 10));
    res.json({ success: true, message: "Patrons fetched", data });
  }),

  createPatron: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.createPatron(tenant, req.body);
    res.status(201).json({ success: true, message: "Patron mapping created", data });
  }),

  getPatron: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.getPatron(tenant, Number(req.params.id));
    res.json({ success: true, message: "Patron fetched", data });
  }),

  getPatronByStudent: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.getPatronByStudent(tenant, Number(req.params.student_id));
    res.json({ success: true, message: "Patron mapping fetched", data });
  }),

  updatePatron: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.updatePatron(tenant, Number(req.params.id), req.body);
    res.json({ success: true, message: "Patron mapping updated", data });
  }),

  updatePatronByEmail: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.updatePatronByEmail(tenant, String(req.params.email), req.body);
    res.json({ success: true, message: "Patron mapping updated by email", data });
  }),

  autoMapPatrons: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.autoMapPatrons(tenant);
    res.json({ success: true, message: "Auto-mapping completed", data });
  }),

  deletePatron: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    await crudService.deletePatron(tenant, Number(req.params.id));
    res.json({ success: true, message: "Patron mapping deleted", data: {} });
  }),

  // =====================================================================
  // Clearance Logs CRUD (existing)
  // =====================================================================

  listClearances: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.listClearances(tenant, Number(req.query.page || 1), Number(req.query.limit || 10));
    res.json({ success: true, message: "Clearance logs fetched", data });
  }),

  syncClearanceLogs: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.syncClearanceLogs(tenant);
    res.json({ success: true, message: "Clearance logs synced", data });
  }),

  createClearance: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.createClearance(tenant, req.body);
    res.status(201).json({ success: true, message: "Clearance log created", data });
  }),

  getClearance: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.getClearance(tenant, Number(req.params.id));
    res.json({ success: true, message: "Clearance log fetched", data });
  }),

  updateClearance: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await crudService.updateClearance(tenant, Number(req.params.id), req.body);
    res.json({ success: true, message: "Clearance log updated", data });
  }),

  deleteClearance: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    await crudService.deleteClearance(tenant, Number(req.params.id));
    res.json({ success: true, message: "Clearance log deleted", data: {} });
  }),

  // =====================================================================
  // Circulation — Checkouts (NEW)
  // =====================================================================

  listCheckouts: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await circulationService.listCheckouts(tenant, req.query as any);
    res.json({ success: true, message: "Checkouts fetched", data });
  }),

  getPatronCheckouts: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const checkouts = await circulationService.getPatronCheckouts(tenant, String(req.params.patron_id));
    res.json({ success: true, message: "Patron checkouts fetched", data: { items: checkouts } });
  }),

  issueBook: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await circulationService.issueBook(tenant, req.body);
    res.status(201).json({ success: true, message: "Book issued successfully", data });
  }),

  renewCheckout: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await circulationService.renewCheckout(tenant, String(req.params.id));
    res.json({ success: true, message: "Checkout renewed successfully", data });
  }),

  returnBook: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await circulationService.returnBook(tenant, String(req.params.id));
    res.json({ success: true, message: "Book returned successfully", data });
  }),

  // =====================================================================
  // Holds / Reservations (NEW)
  // =====================================================================

  listHolds: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await holdsService.listHolds(tenant, req.query as any);
    res.json({ success: true, message: "Holds fetched", data });
  }),

  getPatronHolds: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const holds = await holdsService.getPatronHolds(tenant, String(req.params.patron_id));
    res.json({ success: true, message: "Patron holds fetched", data: { items: holds } });
  }),

  placeHold: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await holdsService.placeHold(tenant, req.body);
    res.status(201).json({ success: true, message: "Hold placed successfully", data });
  }),

  cancelHold: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await holdsService.cancelHold(tenant, String(req.params.id));
    res.json({ success: true, message: "Hold cancelled successfully", data });
  }),

  // =====================================================================
  // Koha Health (NEW)
  // =====================================================================

  kohaHealth: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await libraryService.getKohaHealth(tenant);
    res.json({ success: true, message: "Koha health checked", data });
  }),

  // =====================================================================
  // Koha Patron Search (NEW)
  // =====================================================================

  searchKohaPatrons: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const q = String(req.query.q || "");
    const data = await libraryService.searchKohaPatrons(tenant, q);
    res.json({ success: true, message: "Koha patrons fetched", data });
  }),

  // =====================================================================
  // Koha Borrowers — Direct CRUD (NEW)
  // =====================================================================

  listDefaulters: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? "");
    const daysOverdue = Number(req.query.daysOverdue ?? 14);
    const data = await kohaPatronService.listDefaulters(tenant, daysOverdue, page, limit, q);
    res.json({ success: true, message: "Koha defaulters fetched", data });
  }),

  listKohaBorrowers: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = String(req.query.q ?? "");
    const activeOnly = req.query.activeOnly === "true";
    const data = await kohaPatronService.listKohaBorrowers(tenant, page, limit, q, activeOnly);
    res.json({ success: true, message: "Koha borrowers fetched", data });
  }),

  getKohaBorrower: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await kohaPatronService.getKohaBorrower(tenant, String(req.params.patron_id));
    res.json({ success: true, message: "Koha borrower fetched", data });
  }),

  createKohaBorrower: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await kohaPatronService.createKohaBorrower(tenant, req.body);
    res.status(201).json({ success: true, message: "Koha borrower created", data });
  }),

  updateKohaBorrower: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const data = await kohaPatronService.updateKohaBorrower(tenant, String(req.params.patron_id), req.body);
    res.json({ success: true, message: "Koha borrower updated", data });
  }),

  deleteKohaBorrower: asyncHandler(async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    await kohaPatronService.deleteKohaBorrower(tenant, String(req.params.patron_id));
    res.json({ success: true, message: "Koha borrower deleted", data: {} });
  }),
};
