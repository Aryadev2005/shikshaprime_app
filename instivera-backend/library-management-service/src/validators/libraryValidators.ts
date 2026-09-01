import { body, param, query } from "express-validator";

// ── Common ────────────────────────────────────────────────────────────────

export const idParamValidator = [param("id").isInt({ min: 1 })];
export const studentIdParamValidator = [param("student_id").isInt({ min: 1 })];
export const patronIdParamValidator = [param("patron_id").notEmpty().withMessage("patron_id is required")];

export const paginationValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 1000 }),
];

export const emailParamValidator = [param("email").isEmail().withMessage("Valid email is required")];

// ── Patron Mapping ────────────────────────────────────────────────────────

export const createPatronValidator = [
  body("student_id").isInt({ min: 1 }),
  body("koha_patron_id").isString().notEmpty(),
  body("patron_type").isIn(["STUDENT", "STAFF"]),
  body("remarks").optional().isString(),
];

export const updatePatronValidator = [
  ...idParamValidator,
  body("student_id").optional().isInt({ min: 1 }),
  body("koha_patron_id").optional().isString().notEmpty(),
  body("patron_type").optional().isIn(["STUDENT", "STAFF"]),
  body("is_active").optional().isIn([0, 1]),
  body("remarks").optional().isString(),
];

// ── Koha Settings ─────────────────────────────────────────────────────────

export const createKohaSettingValidator = [
  body("setting_key").isString().notEmpty(),
  body("setting_value").optional().isString(),
  body("setting_group").optional().isString(),
  body("description").optional().isString(),
  body("is_encrypted").optional().isIn([0, 1]),
  body("is_active").optional().isIn([0, 1]),
];

export const updateKohaSettingValidator = [
  ...idParamValidator,
  body("setting_value").optional().isString(),
  body("setting_group").optional().isString(),
  body("description").optional().isString(),
  body("is_encrypted").optional().isIn([0, 1]),
  body("is_active").optional().isIn([0, 1]),
];

// ── Clearance Logs ────────────────────────────────────────────────────────

export const createClearanceValidator = [
  body("student_id").isInt({ min: 1 }),
  body("koha_patron_id").optional().isString(),
  body("has_pending_books").isIn([0, 1]),
  body("pending_books_count").isInt({ min: 0 }),
  body("pending_fine_amount").isFloat({ min: 0 }),
  body("is_clear").isIn([0, 1]),
  body("context").isIn(["RESULT_PUBLISH", "ADMIT_CARD", "GRADUATION", "MANUAL_CHECK", "OTHER"]),
  body("checked_by").optional().isInt({ min: 1 }),
  body("remarks").optional().isString(),
];

export const updateClearanceValidator = [
  ...idParamValidator,
  body("has_pending_books").optional().isIn([0, 1]),
  body("pending_books_count").optional().isInt({ min: 0 }),
  body("pending_fine_amount").optional().isFloat({ min: 0 }),
  body("is_clear").optional().isIn([0, 1]),
  body("context").optional().isIn(["RESULT_PUBLISH", "ADMIT_CARD", "GRADUATION", "MANUAL_CHECK", "OTHER"]),
  body("remarks").optional().isString(),
];

// ── Circulation — Checkouts (NEW) ─────────────────────────────────────────

export const issueBookValidator = [
  body("patron_id").notEmpty().withMessage("patron_id is required"),
  body("item_id").notEmpty().withMessage("item_id is required"),
];

export const checkoutIdParamValidator = [
  param("id").notEmpty().withMessage("checkout id is required"),
];

// ── Holds / Reservations (NEW) ────────────────────────────────────────────

export const placeHoldValidator = [
  body("patron_id").notEmpty().withMessage("patron_id is required"),
  body("biblio_id").notEmpty().withMessage("biblio_id is required"),
  body("pickup_library_id").optional().isString(),
];

export const holdIdParamValidator = [
  param("id").notEmpty().withMessage("hold id is required"),
];

// ── Koha Borrowers — Direct CRUD (NEW) ────────────────────────────────────────

export const kohaPatronIdParamValidator = [
  param("patron_id").notEmpty().withMessage("patron_id is required"),
];

export const createKohaBorrowerValidator = [
  body("firstname").isString().notEmpty().withMessage("firstname is required"),
  body("surname").isString().notEmpty().withMessage("surname is required"),
  body("cardnumber").optional().isString(),
  body("category_id").optional().isString(),
  body("library_id").optional().isString(),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("phone").optional().isString(),
  body("address").optional().isString(),
  body("city").optional().isString(),
  body("date_of_birth").optional().isString(),
  body("expiry_date").optional().isString(),
  body("userid").optional().isString(),
  body("password").optional().isString(),
];

export const updateKohaBorrowerValidator = [
  body("firstname").optional().isString().notEmpty(),
  body("surname").optional().isString().notEmpty(),
  body("cardnumber").optional().isString(),
  body("category_id").optional().isString(),
  body("library_id").optional().isString(),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("phone").optional().isString(),
  body("address").optional().isString(),
  body("city").optional().isString(),
  body("date_of_birth").optional().isString(),
  body("expiry_date").optional().isString(),
  body("userid").optional().isString(),
  body("password").optional().isString(),
];
