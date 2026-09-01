import { QueryTypes } from "sequelize";
import { getTenantModels, getTenantSequelize } from "../models";
import { ApiError } from "../utils/ApiError";
import { decrypt, encrypt } from "../utils/encryption";
import { kohaSettingsService } from "./kohaSettingsService";

type PatronType = "STUDENT" | "STAFF";
type ClearanceContext = "RESULT_PUBLISH" | "ADMIT_CARD" | "GRADUATION" | "MANUAL_CHECK" | "OTHER";

interface PaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  koha_status?: string;
}

const ALLOWED_CLEARANCE_CONTEXTS: ClearanceContext[] = [
  "RESULT_PUBLISH",
  "ADMIT_CARD",
  "GRADUATION",
  "MANUAL_CHECK",
  "OTHER",
];

function pick<T extends object>(payload: T, keys: Array<keyof T>): Partial<T> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if ((payload as any)[key] !== undefined) {
      (result as any)[key] = (payload as any)[key];
    }
  }
  return result;
}

class CrudService {
  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private toTinyInt(value: unknown, fallback = 0): number {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    const parsed = Number(value);
    return parsed === 1 ? 1 : 0;
  }

  private toDecimal(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Number(parsed.toFixed(2));
  }

  private pagination(page = 1, limit = 10): { page: number; limit: number; offset: number } {
    const safePage = this.toPositiveInt(page, 1);
    const safeLimit = this.toPositiveInt(limit, 10);
    return {
      page: safePage,
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
    };
  }

  private maskSettingValue<T extends { is_encrypted?: number; setting_value?: string | null }>(setting: T): T {
    if (Number(setting.is_encrypted || 0) === 1 && setting.setting_value) {
      return {
        ...setting,
        setting_value: "********",
      };
    }
    return setting;
  }

  private normalizeSettingValue(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    return String(value);
  }

  private encodeSettingValue(value: string | null, isEncrypted: number): string | null {
    if (value === null) {
      return null;
    }
    if (isEncrypted !== 1) {
      return value;
    }
    try {
      return encrypt(value);
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to encrypt setting value: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private reEncodeExistingSettingValue(
    currentValue: string | null | undefined,
    currentIsEncrypted: number,
    targetIsEncrypted: number,
  ): string | null {
    if (currentValue === null || currentValue === undefined) {
      return null;
    }

    if (currentIsEncrypted === targetIsEncrypted) {
      return currentValue;
    }

    if (currentIsEncrypted === 0 && targetIsEncrypted === 1) {
      return this.encodeSettingValue(currentValue, 1);
    }

    try {
      return decrypt(currentValue);
    } catch (error) {
      throw new ApiError(
        400,
        `Unable to decrypt existing setting value: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async ensureStudentExists(tenant: string, studentId: number): Promise<void> {
    const sequelize = getTenantSequelize(tenant);
    const [student] = (await sequelize.query(`SELECT id FROM students WHERE id = :id LIMIT 1`, {
      replacements: { id: studentId },
      type: QueryTypes.SELECT,
    })) as Array<{ id: number }>;

    if (!student) {
      throw new ApiError(400, `Student ${studentId} not found`);
    }
  }

  private async ensurePatronOwnerExists(
    tenant: string,
    ownerId: number,
    patronType: PatronType,
  ): Promise<void> {
    const sequelize = getTenantSequelize(tenant);

    if (patronType === "STAFF") {
      const [teacher] = (await sequelize.query(`SELECT id FROM teachers WHERE id = :id LIMIT 1`, {
        replacements: { id: ownerId },
        type: QueryTypes.SELECT,
      })) as Array<{ id: number }>;

      if (!teacher) {
        throw new ApiError(400, `Teacher ${ownerId} not found`);
      }
      return;
    }

    await this.ensureStudentExists(tenant, ownerId);
  }

  private normalizeContext(value: unknown): ClearanceContext {
    const context = String(value || "OTHER").toUpperCase() as ClearanceContext;
    if (!ALLOWED_CLEARANCE_CONTEXTS.includes(context)) {
      throw new ApiError(400, "Invalid clearance context");
    }
    return context;
  }

  private normalizeDate(value: unknown): Date {
    if (!value) {
      return new Date();
    }
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, "Invalid checked_at value");
    }
    return parsed;
  }

  async listSettings(tenant: string, page = 1, limit = 10): Promise<PaginationResult<any>> {
    const { page: safePage, limit: safeLimit, offset } = this.pagination(page, limit);
    const { KohaSettings } = getTenantModels(tenant);

    const { rows, count } = await KohaSettings.findAndCountAll({
      where: { is_deleted: 0 },
      order: [["id", "DESC"]],
      offset,
      limit: safeLimit,
    });

    const items = rows.map((row) => this.maskSettingValue(row.toJSON() as any));

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: count,
        total_pages: Math.max(1, Math.ceil(count / safeLimit)),
      },
    };
  }

  async createSetting(tenant: string, payload: any): Promise<any> {
    const data = pick(payload || {}, [
      "setting_key",
      "setting_value",
      "setting_group",
      "description",
      "is_encrypted",
      "is_active",
    ]);

    const settingKey = String(data.setting_key || "").trim();
    if (!settingKey) {
      throw new ApiError(400, "setting_key is required");
    }

    const { KohaSettings } = getTenantModels(tenant);
    const existing = await KohaSettings.findOne({ where: { setting_key: settingKey } });

    if (existing) {
      const finalIsEncrypted = this.toTinyInt(
        data.is_encrypted !== undefined ? data.is_encrypted : existing.is_encrypted,
        existing.is_encrypted,
      );

      const finalValue =
        data.setting_value !== undefined
          ? this.encodeSettingValue(this.normalizeSettingValue(data.setting_value), finalIsEncrypted)
          : this.reEncodeExistingSettingValue(
            existing.setting_value,
            Number(existing.is_encrypted || 0),
            finalIsEncrypted,
          );

      const updated = await existing.update({
        setting_key: settingKey,
        setting_value: finalValue,
        setting_group:
          data.setting_group !== undefined ? String(data.setting_group) : existing.setting_group,
        description: data.description !== undefined ? String(data.description) : existing.description,
        is_encrypted: finalIsEncrypted,
        is_active: this.toTinyInt(data.is_active, 1),
        is_deleted: 0,
      });

      await kohaSettingsService.refresh(tenant);
      return this.maskSettingValue(updated.toJSON() as any);
    }

    const isEncrypted = this.toTinyInt(data.is_encrypted, 0);
    const settingValue = this.encodeSettingValue(
      this.normalizeSettingValue(data.setting_value),
      isEncrypted,
    );

    const created = await KohaSettings.create({
      setting_key: settingKey,
      setting_value: settingValue,
      setting_group: data.setting_group !== undefined ? String(data.setting_group) : null,
      description: data.description !== undefined ? String(data.description) : null,
      is_encrypted: isEncrypted,
      is_active: this.toTinyInt(data.is_active, 1),
      is_deleted: 0,
    });

    await kohaSettingsService.refresh(tenant);
    return this.maskSettingValue(created.toJSON() as any);
  }

  async getSetting(tenant: string, id: number): Promise<any> {
    const { KohaSettings } = getTenantModels(tenant);
    const row = await KohaSettings.findOne({ where: { id, is_deleted: 0 } });
    if (!row) {
      throw new ApiError(404, "Setting not found");
    }
    return this.maskSettingValue(row.toJSON() as any);
  }

  async updateSetting(tenant: string, id: number, payload: any): Promise<any> {
    const { KohaSettings } = getTenantModels(tenant);
    const row = await KohaSettings.findOne({ where: { id, is_deleted: 0 } });
    if (!row) {
      throw new ApiError(404, "Setting not found");
    }

    const data = pick(payload || {}, ["setting_value", "setting_group", "description", "is_encrypted", "is_active"]);

    const finalIsEncrypted = this.toTinyInt(
      data.is_encrypted !== undefined ? data.is_encrypted : row.is_encrypted,
      row.is_encrypted,
    );

    const finalValue =
      data.setting_value !== undefined
        ? this.encodeSettingValue(this.normalizeSettingValue(data.setting_value), finalIsEncrypted)
        : this.reEncodeExistingSettingValue(
          row.setting_value,
          Number(row.is_encrypted || 0),
          finalIsEncrypted,
        );

    const updated = await row.update({
      setting_value: finalValue,
      setting_group: data.setting_group !== undefined ? String(data.setting_group) : row.setting_group,
      description: data.description !== undefined ? String(data.description) : row.description,
      is_encrypted: finalIsEncrypted,
      is_active: data.is_active !== undefined ? this.toTinyInt(data.is_active, 1) : row.is_active,
    });

    await kohaSettingsService.refresh(tenant);
    return this.maskSettingValue(updated.toJSON() as any);
  }

  async deleteSetting(tenant: string, id: number): Promise<void> {
    const { KohaSettings } = getTenantModels(tenant);
    const row = await KohaSettings.findOne({ where: { id, is_deleted: 0 } });
    if (!row) {
      throw new ApiError(404, "Setting not found");
    }

    await row.update({ is_deleted: 1, is_active: 0 });
    await kohaSettingsService.refresh(tenant);
  }

  async listPatrons(tenant: string, page = 1, limit = 10): Promise<PaginationResult<any>> {
    const { page: safePage, limit: safeLimit, offset } = this.pagination(page, limit);
    const { LibraryPatrons } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    const total = await LibraryPatrons.count({ where: { is_deleted: 0 } });
    const items = (await sequelize.query(
      `
      SELECT
        lp.*,
        s.student_name AS student_name,
        s.email AS student_email,
        s.student_id AS student_public_id,
        CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')) AS teacher_name,
        t.email AS teacher_email,
        t.employee_id AS teacher_public_id
      FROM library_patrons lp
      LEFT JOIN students s ON lp.student_id = s.id AND lp.patron_type = 'STUDENT'
      LEFT JOIN teachers t ON lp.student_id = t.id AND lp.patron_type = 'STAFF'
      WHERE lp.is_deleted = 0
      ORDER BY lp.id DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { limit: safeLimit, offset },
        type: QueryTypes.SELECT,
      },
    )) as any[];

    const mappedItems = items.map((row) => {
      const isStudent = row.patron_type === "STUDENT";
      return {
        ...row,
        display_name: isStudent ? row.student_name : String(row.teacher_name || "").trim(),
        display_public_id: isStudent ? row.student_public_id : row.teacher_public_id,
        email: isStudent ? row.student_email : row.teacher_email,
      };
    });

    return {
      items: mappedItems,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async createPatron(tenant: string, payload: any): Promise<any> {
    const data = pick(payload || {}, [
      "student_id",
      "koha_patron_id",
      "patron_type",
      "is_active",
      "remarks",
    ]);

    const studentId = this.toPositiveInt(data.student_id, 0);
    if (!studentId) {
      throw new ApiError(400, "student_id is required");
    }

    const patronType = (String(data.patron_type || "STUDENT").toUpperCase() as PatronType);
    if (patronType !== "STUDENT" && patronType !== "STAFF") {
      throw new ApiError(400, "patron_type must be STUDENT or STAFF");
    }

    await this.ensurePatronOwnerExists(tenant, studentId, patronType);

    const { LibraryPatrons } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);
    const transaction = await sequelize.transaction();

    try {
      const duplicate = await LibraryPatrons.findOne({
        where: { student_id: studentId, patron_type: patronType, is_deleted: 0 },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (duplicate) {
        throw new ApiError(409, "Patron mapping already exists for this user");
      }

      // Automated Koha Sync implementation
      let finalKohaPatronId = String(data.koha_patron_id || "").trim();

      const { kohaPatronService } = require("./kohaPatronService");

      let erpUser;
      if (patronType === "STUDENT") {
        const [student] = (await sequelize.query(`SELECT id, student_id, student_name, email, phone FROM students WHERE id = :id LIMIT 1`, {
          replacements: { id: studentId }, type: QueryTypes.SELECT, transaction
        })) as any[];
        erpUser = student;
      } else {
        const [teacher] = (await sequelize.query(`SELECT id, employee_id as student_id, CONCAT(first_name, ' ', last_name) as student_name, email, phone FROM teachers WHERE id = :id LIMIT 1`, {
          replacements: { id: studentId }, type: QueryTypes.SELECT, transaction
        })) as any[];
        erpUser = teacher;
      }

      // If no ID is provided, automatically create the patron in Koha
      if (!finalKohaPatronId) {
        if (erpUser) {
          const names = (erpUser.student_name || "Unknown User").trim().split(" ");
          const surname = names.length > 1 ? names.pop() || "" : names[0];
          const firstname = names.length > 1 ? names.join(" ") : names[0];

          const newKohaPatron = await kohaPatronService.createKohaBorrower(tenant, {
            firstname,
            surname,
            userid: String(erpUser.student_id), // Public ID
            cardnumber: String(erpUser.student_id), // Enforce strict mapping
            email: erpUser.email || "",
            phone: erpUser.phone || "",
            category_id: patronType === "STUDENT" ? "ST" : "PT", // Default categories
            library_id: "MAIN"
          });
          finalKohaPatronId = String(newKohaPatron.patron_id);
        }
      } else if (erpUser) {
        // Enforce strict mapping by updating the Koha patron with the ERP public ID even on manual map
        await kohaPatronService.updateKohaBorrower(tenant, finalKohaPatronId, {
          cardnumber: String(erpUser.student_id)
        });
      }

      if (!finalKohaPatronId) {
        throw new ApiError(400, "Failed to generate or retrieve koha_patron_id");
      }

      const created = await LibraryPatrons.create({
        student_id: studentId,
        koha_patron_id: finalKohaPatronId,
        patron_type: patronType,
        is_active: this.toTinyInt(data.is_active, 1),
        remarks: data.remarks !== undefined ? String(data.remarks) : null,
        is_deleted: 0,
      }, { transaction });

      await transaction.commit();
      return created;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getPatron(tenant: string, id: number): Promise<any> {
    const { LibraryPatrons } = getTenantModels(tenant);
    const row = await LibraryPatrons.findOne({ where: { id, is_deleted: 0 } });
    if (!row) {
      throw new ApiError(404, "Patron mapping not found");
    }
    return row;
  }

  async getPatronByStudent(tenant: string, studentId: number): Promise<any> {
    const { LibraryPatrons } = getTenantModels(tenant);
    const row = await LibraryPatrons.findOne({
      where: { student_id: studentId, is_deleted: 0 },
      order: [["id", "DESC"]],
    });

    if (!row) {
      throw new ApiError(404, "Patron mapping not found");
    }
    return row;
  }

  async updatePatron(tenant: string, id: number, payload: any): Promise<any> {
    const { LibraryPatrons } = getTenantModels(tenant);
    const row = await LibraryPatrons.findOne({ where: { id, is_deleted: 0 } });
    if (!row) {
      throw new ApiError(404, "Patron mapping not found");
    }

    const data = pick(payload || {}, [
      "student_id",
      "koha_patron_id",
      "patron_type",
      "is_active",
      "remarks",
    ]);

    const finalStudentId =
      data.student_id !== undefined ? this.toPositiveInt(data.student_id, 0) : row.student_id;
    if (!finalStudentId) {
      throw new ApiError(400, "student_id must be a positive integer");
    }

    const finalPatronType = (String(data.patron_type || row.patron_type).toUpperCase() as PatronType);
    if (finalPatronType !== "STUDENT" && finalPatronType !== "STAFF") {
      throw new ApiError(400, "patron_type must be STUDENT or STAFF");
    }

    await this.ensurePatronOwnerExists(tenant, finalStudentId, finalPatronType);

    const duplicate = await LibraryPatrons.findOne({
      where: {
        student_id: finalStudentId,
        patron_type: finalPatronType,
        is_deleted: 0,
      },
    });

    if (duplicate && Number(duplicate.id) !== Number(id)) {
      throw new ApiError(409, "Another patron mapping already exists for this user");
    }

    const updatedRow = await row.update({
      student_id: finalStudentId,
      koha_patron_id:
        data.koha_patron_id !== undefined
          ? String(data.koha_patron_id).trim()
          : row.koha_patron_id,
      patron_type: finalPatronType,
      is_active: data.is_active !== undefined ? this.toTinyInt(data.is_active, 1) : row.is_active,
      remarks: data.remarks !== undefined ? String(data.remarks) : row.remarks,
    });

    // Enforce strict mapping logic: Sync the public ID to Koha's userid and cardnumber
    if (updatedRow.koha_patron_id) {
      const { kohaPatronService } = require("./kohaPatronService");
      const sequelize = getTenantSequelize(tenant);

      let erpUser;
      if (finalPatronType === "STUDENT") {
        const [student] = (await sequelize.query(`SELECT student_id FROM students WHERE id = :id LIMIT 1`, {
          replacements: { id: finalStudentId }, type: QueryTypes.SELECT
        })) as any[];
        erpUser = student;
      } else {
        const [teacher] = (await sequelize.query(`SELECT employee_id as student_id FROM teachers WHERE id = :id LIMIT 1`, {
          replacements: { id: finalStudentId }, type: QueryTypes.SELECT
        })) as any[];
        erpUser = teacher;
      }

      if (erpUser && erpUser.student_id) {
        try {
          await kohaPatronService.updateKohaBorrower(tenant, updatedRow.koha_patron_id, {
            cardnumber: String(erpUser.student_id)
          });
        } catch (err: any) {
          console.warn(`Failed to sync cardnumber to Koha for patron ${updatedRow.koha_patron_id}:`, err.message);
          // Don't throw here, otherwise the frontend gets a 400 even though the DB update succeeded
        }
      }
    }

    return updatedRow;
  }

  async updatePatronByEmail(tenant: string, email: string, payload: any): Promise<any> {
    const sequelize = getTenantSequelize(tenant);
    
    // 1. Find the student or teacher by email
    const [student] = (await sequelize.query(`SELECT id FROM students WHERE email = :email LIMIT 1`, {
      replacements: { email },
      type: QueryTypes.SELECT,
    })) as Array<{ id: number }>;

    let ownerId;
    let patronType: PatronType;

    if (student) {
      ownerId = student.id;
      patronType = "STUDENT";
    } else {
      const [teacher] = (await sequelize.query(`SELECT id FROM teachers WHERE email = :email LIMIT 1`, {
        replacements: { email },
        type: QueryTypes.SELECT,
      })) as Array<{ id: number }>;

      if (teacher) {
        ownerId = teacher.id;
        patronType = "STAFF";
      } else {
        throw new ApiError(404, "User not found with this email");
      }
    }

    // 2. Find the LibraryPatrons mapping for this owner
    const { LibraryPatrons } = getTenantModels(tenant);
    const row = await LibraryPatrons.findOne({
      where: { student_id: ownerId, patron_type: patronType, is_deleted: 0 },
    });

    if (!row) {
      throw new ApiError(404, "Patron mapping not found for this email");
    }

    // 3. Re-use updatePatron logic
    return this.updatePatron(tenant, row.id, payload);
  }

  async autoMapPatrons(tenant: string): Promise<{ totalChecked: number; mappedStudents: number; mappedStaff: number; alreadyMapped: number }> {
    const sequelize = getTenantSequelize(tenant);
    const { LibraryPatrons } = getTenantModels(tenant);
    const { kohaPatronService } = require("./kohaPatronService");
    
    // 1. Fetch all Koha borrowers (up to 5000)
    let kohaBorrowers;
    try {
      const response = await kohaPatronService.listKohaBorrowers(tenant, 1, 5000);
      kohaBorrowers = response.items;
    } catch (err: any) {
      throw new ApiError(500, `Failed to fetch Koha borrowers: ${err.message}`);
    }

    let mappedStudents = 0;
    let mappedStaff = 0;
    let alreadyMapped = 0;
    let totalChecked = kohaBorrowers.length;

    // We can do queries in a loop, or pre-fetch all students/teachers with emails.
    // For simplicity and safety, we'll loop with batched queries.
    for (const borrower of kohaBorrowers) {
      if (!borrower.email || typeof borrower.email !== 'string') continue;
      
      const email = borrower.email.trim();
      if (!email) continue;
      
      // Look up in students
      const [student] = (await sequelize.query(`SELECT id, student_id FROM students WHERE email = :email LIMIT 1`, {
        replacements: { email },
        type: QueryTypes.SELECT,
      })) as Array<{ id: number, student_id: string }>;

      let ownerId;
      let publicId;
      let patronType: PatronType;

      if (student) {
        ownerId = student.id;
        publicId = student.student_id;
        patronType = "STUDENT";
      } else {
        const [teacher] = (await sequelize.query(`SELECT id, employee_id FROM teachers WHERE email = :email LIMIT 1`, {
          replacements: { email },
          type: QueryTypes.SELECT,
        })) as Array<{ id: number, employee_id: string }>;

        if (teacher) {
          ownerId = teacher.id;
          publicId = teacher.employee_id;
          patronType = "STAFF";
        } else {
          continue; // Not found in our ERP
        }
      }

      // Check if mapping exists
      const existing = await LibraryPatrons.findOne({
        where: { student_id: ownerId, patron_type: patronType, is_deleted: 0 },
      });

      if (existing) {
        // If it exists, but points to a different koha_patron_id, we could update it.
        // But if it's already mapped to something, we assume it's fine.
        // Let's just update the koha_patron_id to ensure it matches the one we found.
        if (String(existing.koha_patron_id) !== String(borrower.patron_id)) {
           await existing.update({ koha_patron_id: String(borrower.patron_id) });
        }
        alreadyMapped++;
      } else {
        // Create new mapping
        await LibraryPatrons.create({
          student_id: ownerId,
          koha_patron_id: String(borrower.patron_id),
          patron_type: patronType,
          is_active: 1,
          is_deleted: 0,
        });

        if (patronType === "STUDENT") {
          mappedStudents++;
        } else {
          mappedStaff++;
        }
      }

      // Sync the cardnumber to Koha just to be safe and enforce the strict mapping
      try {
        if (publicId && String(borrower.cardnumber) !== String(publicId)) {
          await kohaPatronService.updateKohaBorrower(tenant, borrower.patron_id, {
            cardnumber: String(publicId)
          });
        }
      } catch (err) {
        // Ignore Koha sync errors during bulk map
      }
    }

    return {
      totalChecked,
      mappedStudents,
      mappedStaff,
      alreadyMapped
    };
  }

  async deletePatron(tenant: string, id: number): Promise<void> {
    const { LibraryPatrons } = getTenantModels(tenant);
    const row = await LibraryPatrons.findOne({ where: { id, is_deleted: 0 } });
    if (!row) {
      throw new ApiError(404, "Patron mapping not found");
    }

    if (row.koha_patron_id) {
      const { kohaClient } = require("../clients/kohaClient");
      try {
        const checkoutsRaw = await kohaClient.getPatronCheckouts(tenant, row.koha_patron_id);
        const checkouts = Array.isArray(checkoutsRaw) ? checkoutsRaw : (checkoutsRaw?.data || []);
        if (checkouts.length > 0) {
          // Architectural Fix: Transition to restricted category
          await kohaClient.updatePatron(tenant, row.koha_patron_id, {
            category_id: 'RESTRICTED',
            opacnote: 'Soft deleted in ERP but has pending checkouts'
          });
        } else {
          await kohaClient.updatePatron(tenant, row.koha_patron_id, { expiry_date: '2000-01-01' });
        }
      } catch (err) {
        console.warn(`Failed to expire/restrict Koha patron ${row.koha_patron_id} during soft delete`, err);
      }
    }

    await row.update({ is_deleted: 1, is_active: 0 });
  }

  async listClearances(tenant: string, page = 1, limit = 10): Promise<PaginationResult<any>> {
    const { page: safePage, limit: safeLimit, offset } = this.pagination(page, limit);
    const { LibraryClearanceLogs, LibraryPatrons } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    // 1. Get total number of mapped students
    const total = await LibraryPatrons.count({ where: { is_deleted: 0, patron_type: "STUDENT" } });

    // 2. Fetch the paginated chunk of mapped students
    const mappings = (await sequelize.query(
      `
      SELECT lp.student_id, lp.koha_patron_id,
             s.first_name, s.last_name
      FROM library_patrons lp
      JOIN students s ON s.id = lp.student_id
      WHERE lp.is_deleted = 0 AND lp.patron_type = 'STUDENT'
      ORDER BY lp.id DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { limit: safeLimit, offset },
        type: QueryTypes.SELECT,
      },
    )) as Array<{ student_id: number; koha_patron_id: string; first_name: string; last_name: string }>;

    // 3. Sync with Koha using Promise.allSettled
    let kohaStatus = "UP";
    if (mappings.length > 0) {
      const { kohaClient } = require("../clients/kohaClient"); // lazy load to avoid circular dep if any

      const results = await Promise.allSettled(
        mappings.map(async (m) => {
          if (!m.koha_patron_id) return;
          const [checkoutsResponse, accountResponse] = await Promise.all([
            kohaClient.getPatronCheckouts(tenant, m.koha_patron_id),
            kohaClient.getPatronAccount(tenant, m.koha_patron_id)
          ]);
          return { m, checkoutsResponse, accountResponse };
        })
      );

      for (const res of results) {
        if (res.status === "rejected") {
          kohaStatus = "DOWN";
          console.error("Failed to sync Koha data for a student:", res.reason instanceof Error ? res.reason.message : "Unknown error");
          continue;
        }

        const data = res.value;
        if (!data) continue;

        try {
          // Koha returns an array for checkouts or embedded items
          const checkouts = Array.isArray(data.checkoutsResponse) ? data.checkoutsResponse : (data.checkoutsResponse?.data || []);
          const pendingBooksCount = checkouts.length;

          // Account balance might be in accountResponse.balance or outstanding_balance
          const pendingFineAmount = Number(data.accountResponse?.outstanding_balance ?? data.accountResponse?.balance ?? 0);

          const isClear = pendingBooksCount === 0 && pendingFineAmount <= 0;

          // 4. UPSERT into library_clearance_logs
          await sequelize.query(
            `
              INSERT INTO library_clearance_logs 
                (student_id, koha_patron_id, has_pending_books,
                 pending_books_count, pending_fine_amount, 
                 is_clear, context, checked_at, is_deleted)
              VALUES (:student_id, :koha_patron_id, :has_pending_books, :pending_books_count, :pending_fine_amount, :is_clear, 'OTHER', NOW(), 0)
              ON DUPLICATE KEY UPDATE
                koha_patron_id = VALUES(koha_patron_id),
                has_pending_books = VALUES(has_pending_books),
                pending_books_count = VALUES(pending_books_count),
                pending_fine_amount = VALUES(pending_fine_amount),
                is_clear = VALUES(is_clear),
                checked_at = NOW(),
                is_deleted = 0
              `,
            {
              replacements: {
                student_id: data.m.student_id,
                koha_patron_id: data.m.koha_patron_id,
                has_pending_books: pendingBooksCount > 0 ? 1 : 0,
                pending_books_count: pendingBooksCount,
                pending_fine_amount: pendingFineAmount,
                is_clear: isClear ? 1 : 0
              }
            }
          );
        } catch (err) {
          // Silently fail for this specific student, their old DB data will be used
          console.error(`Failed to sync Koha data for student ${data.m.student_id}:`, err instanceof Error ? err.message : "Unknown error");
        }
      }
    }

    // 5. Fetch fresh data FROM DB to return to frontend
    // We only fetch for the specific student IDs in our paginated chunk
    const studentIds = mappings.map(m => m.student_id);
    let items: any[] = [];

    if (studentIds.length > 0) {
      items = (await sequelize.query(
        `
        SELECT
          cl.*,
          s.student_name AS student_name,
          s.student_id AS student_public_id
        FROM library_clearance_logs cl
        LEFT JOIN students s ON cl.student_id = s.id
        WHERE cl.is_deleted = 0 AND cl.student_id IN (:studentIds)
        ORDER BY cl.checked_at DESC
        `,
        {
          replacements: { studentIds },
          type: QueryTypes.SELECT,
        },
      )) as any[];
    }

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.max(1, Math.ceil(total / safeLimit)),
      },
      koha_status: kohaStatus
    };
  }

  async syncClearanceLogs(tenant: string): Promise<any> {
    // Manual sync could trigger a background job or just sync the first page.
    // For this endpoint, we'll just sync the first 50 as a "Sync Now" quick action.
    await this.listClearances(tenant, 1, 50);
    return { success: true, message: "Sync triggered successfully" };
  }

  async createClearance(tenant: string, payload: any): Promise<any> {
    const data = pick(payload || {}, [
      "student_id",
      "koha_patron_id",
      "has_pending_books",
      "pending_books_count",
      "pending_fine_amount",
      "is_clear",
      "checked_at",
      "context",
      "checked_by",
      "remarks",
    ]);

    const studentId = this.toPositiveInt(data.student_id, 0);
    if (!studentId) {
      throw new ApiError(400, "student_id is required");
    }

    await this.ensureStudentExists(tenant, studentId);

    const pendingBooksCount = this.toPositiveInt(data.pending_books_count, 0);
    const pendingFineAmount = this.toDecimal(data.pending_fine_amount, 0);
    const hasPendingBooks =
      data.has_pending_books !== undefined
        ? this.toTinyInt(data.has_pending_books, 0)
        : pendingBooksCount > 0
          ? 1
          : 0;

    const isClear =
      data.is_clear !== undefined
        ? this.toTinyInt(data.is_clear, 1)
        : pendingBooksCount === 0 && pendingFineAmount <= 0
          ? 1
          : 0;

    const context = this.normalizeContext(data.context);
    const checkedAt = this.normalizeDate(data.checked_at);

    const { LibraryClearanceLogs } = getTenantModels(tenant);
    return LibraryClearanceLogs.create({
      student_id: studentId,
      koha_patron_id: data.koha_patron_id ? String(data.koha_patron_id) : null,
      has_pending_books: hasPendingBooks,
      pending_books_count: pendingBooksCount,
      pending_fine_amount: pendingFineAmount,
      is_clear: isClear,
      checked_at: checkedAt,
      context,
      checked_by: data.checked_by !== undefined ? Number(data.checked_by) : null,
      remarks: data.remarks !== undefined ? String(data.remarks) : null,
      is_deleted: 0,
    });
  }

  async getClearance(tenant: string, id: number): Promise<any> {
    const sequelize = getTenantSequelize(tenant);
    const [row] = (await sequelize.query(
      `
      SELECT
        cl.*,
        s.student_name AS student_name,
        s.student_id AS student_public_id
      FROM library_clearance_logs cl
      LEFT JOIN students s ON cl.student_id = s.id
      WHERE cl.id = :id AND cl.is_deleted = 0
      LIMIT 1
      `,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      },
    )) as any[];

    if (!row) {
      throw new ApiError(404, "Clearance log not found");
    }

    return row;
  }

  async updateClearance(tenant: string, id: number, payload: any): Promise<any> {
    const { LibraryClearanceLogs } = getTenantModels(tenant);
    const row = await LibraryClearanceLogs.findOne({ where: { id, is_deleted: 0 } });
    if (!row) {
      throw new ApiError(404, "Clearance log not found");
    }

    const data = pick(payload || {}, [
      "student_id",
      "koha_patron_id",
      "has_pending_books",
      "pending_books_count",
      "pending_fine_amount",
      "is_clear",
      "checked_at",
      "context",
      "checked_by",
      "remarks",
    ]);

    if (data.student_id !== undefined) {
      const studentId = this.toPositiveInt(data.student_id, 0);
      if (!studentId) {
        throw new ApiError(400, "student_id must be a positive integer");
      }
      await this.ensureStudentExists(tenant, studentId);
    }

    const updatePayload: Record<string, unknown> = {};

    if (data.student_id !== undefined) updatePayload.student_id = this.toPositiveInt(data.student_id, 0);
    if (data.koha_patron_id !== undefined) updatePayload.koha_patron_id = data.koha_patron_id ? String(data.koha_patron_id) : null;
    if (data.has_pending_books !== undefined) updatePayload.has_pending_books = this.toTinyInt(data.has_pending_books, 0);
    if (data.pending_books_count !== undefined) updatePayload.pending_books_count = this.toPositiveInt(data.pending_books_count, 0);
    if (data.pending_fine_amount !== undefined) updatePayload.pending_fine_amount = this.toDecimal(data.pending_fine_amount, 0);
    if (data.is_clear !== undefined) updatePayload.is_clear = this.toTinyInt(data.is_clear, 0);
    if (data.checked_at !== undefined) updatePayload.checked_at = this.normalizeDate(data.checked_at);
    if (data.context !== undefined) updatePayload.context = this.normalizeContext(data.context);
    if (data.checked_by !== undefined) updatePayload.checked_by = data.checked_by ? Number(data.checked_by) : null;
    if (data.remarks !== undefined) updatePayload.remarks = data.remarks ? String(data.remarks) : null;

    const { kohaClient } = require("../clients/kohaClient");
    if (data.remarks !== undefined && data.remarks !== null && row.koha_patron_id) {
      try {
        await kohaClient.updatePatron(tenant, row.koha_patron_id, {
          opacnote: data.remarks
        });
      } catch (err) {
        console.warn(`Failed to push remarks to Koha for patron ${row.koha_patron_id}`);
      }
    }

    return row.update(updatePayload);
  }

  async deleteClearance(tenant: string, id: number): Promise<void> {
    const { LibraryClearanceLogs } = getTenantModels(tenant);
    const row = await LibraryClearanceLogs.findOne({ where: { id, is_deleted: 0 } });
    if (!row) {
      throw new ApiError(404, "Clearance log not found");
    }

    await row.update({ is_deleted: 1 });
  }
}

export const crudService = new CrudService();
