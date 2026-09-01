import { Op, QueryTypes } from "sequelize";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

export class ClassRoutineService {
  private static async notifyClassRoutine(classId: number, title: string, message: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      await sequelize.query(`
        INSERT INTO notifications (user_id, title, message, type, channel, link, is_read, created_at, updated_at)
        SELECT DISTINCT COALESCE(s.user_id, u.user_id), :title, :message, 'info', 'IN_APP', '/student/class-routine', 0, NOW(), NOW()
        FROM student_personal_details spd
        JOIN students s ON s.id = spd.student_id
        LEFT JOIN users u ON u.email COLLATE utf8mb4_general_ci = s.email COLLATE utf8mb4_general_ci
        WHERE spd.class_id = :classId AND COALESCE(s.user_id, u.user_id) IS NOT NULL;
      `, {
        replacements: { classId, title, message },
        type: QueryTypes.INSERT
      });
    } catch (err) {
      console.error("[CLASS_ROUTINE] Failed to insert notifications:", err);
    }
  }

  private static async notifyClassRoutineTeachers(teacherIds: number[], title: string, message: string, tenant: string) {
    if (!teacherIds || teacherIds.length === 0) return;
    try {
      const sequelize = getTenantSequelize(tenant);
      await sequelize.query(`
        INSERT INTO notifications (user_id, title, message, type, channel, link, is_read, created_at, updated_at)
        SELECT DISTINCT COALESCE(t.user_id, u.user_id), :title, :message, 'info', 'IN_APP', '/teacher/class-routine', 0, NOW(), NOW()
        FROM teachers t
        LEFT JOIN users u ON u.email COLLATE utf8mb4_general_ci = t.email COLLATE utf8mb4_general_ci
        WHERE t.id IN (:teacherIds) AND COALESCE(t.user_id, u.user_id) IS NOT NULL;
      `, {
        replacements: { teacherIds, title, message },
        type: QueryTypes.INSERT
      });
    } catch (err) {
      console.error("[CLASS_ROUTINE] Failed to insert teacher notifications:", err);
    }
  }

  private static timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
  }

  private static formatTime12Hour(timeStr?: string): string {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${strHours}:${minutes} ${ampm}`;
  }

  public static async validateConflicts(
    entries: any[],
    class_id: number,
    tenant: string,
    excludeRoutineId?: number
  ): Promise<Array<{ type: string; message: string; day: string; entryIndex?: number }>> {
    const conflicts: Array<{ type: string; message: string; day: string; entryIndex?: number }> = [];
    if (!entries || entries.length === 0) return conflicts;

    // Layer 0: Strict non-break entry validation (Subject & Teacher required for regular periods)
    for (let i = 0; i < entries.length; i++) {
      const e1 = entries[i];
      if (!e1.is_break) {
        const subId = Number(e1.subject_id || 0);
        const teachId = Number(e1.teacher_id || 0);
        if (subId <= 0 || teachId <= 0) {
          conflicts.push({
            type: "MISSING_REQUIRED_FIELD",
            message: `Validation Error on ${e1.day_of_week} (Period #${e1.period_number || i + 1}): Regular class periods require both a Subject and a Teacher.`,
            day: e1.day_of_week,
            entryIndex: i,
          });
        }
      }
    }

    // Layer 1: Internal form check
    for (let i = 0; i < entries.length; i++) {
      const e1 = entries[i];
      if (e1.is_break) continue;

      const s1 = this.timeToMinutes(e1.start_time);
      const e1End = this.timeToMinutes(e1.end_time);

      if (s1 >= e1End) {
        conflicts.push({
          type: "INVALID_TIME",
          message: `Invalid time on ${e1.day_of_week}: Start time (${this.formatTime12Hour(e1.start_time)}) must be earlier than end time (${this.formatTime12Hour(e1.end_time)})`,
          day: e1.day_of_week,
          entryIndex: i,
        });
      }

      for (let j = i + 1; j < entries.length; j++) {
        const e2 = entries[j];
        if (e2.is_break || e1.day_of_week !== e2.day_of_week) continue;

        const s2 = this.timeToMinutes(e2.start_time);
        const e2End = this.timeToMinutes(e2.end_time);

        // Time overlap check: s1 < e2End && s2 < e1End
        if (s1 < e2End && s2 < e1End) {
          const t1Str = `${this.formatTime12Hour(e1.start_time)} - ${this.formatTime12Hour(e1.end_time)}`;
          const t2Str = `${this.formatTime12Hour(e2.start_time)} - ${this.formatTime12Hour(e2.end_time)}`;

          if (e1.teacher_id && Number(e1.teacher_id) === Number(e2.teacher_id)) {
            conflicts.push({
              type: "TEACHER_INTERNAL_DOUBLE_BOOKING",
              message: `Teacher double-booking on ${e1.day_of_week}: Assigned to multiple overlapping periods (${t1Str} & ${t2Str})`,
              day: e1.day_of_week,
              entryIndex: j,
            });
          } else {
            conflicts.push({
              type: "SAME_CLASS_INTERNAL_OVERLAP",
              message: `Period overlap on ${e1.day_of_week}: Period ${e1.period_number} (${t1Str}) overlaps with Period ${e2.period_number} (${t2Str})`,
              day: e1.day_of_week,
              entryIndex: j,
            });
          }
        }
      }
    }

    const sequelize = getTenantSequelize(tenant);

    // Layer 2: Same-Class DB Conflict Check
    // Layer 3: Teacher Cross-Class Double Booking Check
    for (let idx = 0; idx < entries.length; idx++) {
      const entry = entries[idx];
      if (entry.is_break) continue;

      const newStart = this.timeToMinutes(entry.start_time);
      const newEnd = this.timeToMinutes(entry.end_time);
      if (newStart >= newEnd) continue;

      const entryTimeStr = `${this.formatTime12Hour(entry.start_time)} - ${this.formatTime12Hour(entry.end_time)}`;

      // Layer 2: Same-Class DB Check
      try {
        const queryClass = `
          SELECT cr.id AS routine_id, cr.routine_number, c.name AS class_name, s.name AS subject_name, cre.start_time, cre.end_time, cre.period_number, cre.day_of_week
          FROM class_routine_entries cre
          JOIN class_routines cr ON cr.id = cre.routine_id
          LEFT JOIN subjects s ON s.id = cre.subject_id
          LEFT JOIN classes c ON c.id = cr.class_id
          WHERE cr.status = 'ACTIVE'
          AND cre.is_break = 0
          AND cre.day_of_week = :dayOfWeek
          AND cr.class_id = :classId
          ${excludeRoutineId ? "AND cr.id != :excludeRoutineId" : ""}
        `;

        const [classEntries] = await sequelize.query(queryClass, {
          replacements: {
            dayOfWeek: entry.day_of_week,
            classId: class_id,
            excludeRoutineId: excludeRoutineId || 0,
          },
        });

        for (const ex of classEntries as any[]) {
          const exStart = this.timeToMinutes(ex.start_time);
          const exEnd = this.timeToMinutes(ex.end_time);

          if (newStart < exEnd && exStart < newEnd) {
            const exTimeStr = `${this.formatTime12Hour(ex.start_time)} - ${this.formatTime12Hour(ex.end_time)}`;
            conflicts.push({
              type: "SAME_CLASS_DB_OVERLAP",
              message: `Class schedule conflict on ${entry.day_of_week}: ${entryTimeStr} overlaps with existing ${ex.subject_name || "Period"} (${exTimeStr})`,
              day: entry.day_of_week,
              entryIndex: idx,
            });
          }
        }
      } catch (err) {
        console.warn("Class DB conflict check failed:", err);
      }

      // Layer 3: Teacher Cross-Class Double-Booking Check
      const teacherId = Number(entry.teacher_id || 0);
      if (teacherId > 0) {
        try {
          const queryTeacher = `
            SELECT cr.id AS routine_id, cr.routine_number, c.name AS class_name, t.first_name, t.last_name, s.name AS subject_name, cre.start_time, cre.end_time, cre.day_of_week
            FROM class_routine_entries cre
            JOIN class_routines cr ON cr.id = cre.routine_id
            LEFT JOIN teachers t ON t.id = cre.teacher_id
            LEFT JOIN classes c ON c.id = cr.class_id
            LEFT JOIN subjects s ON s.id = cre.subject_id
            WHERE cr.status = 'ACTIVE'
            AND cre.is_break = 0
            AND cre.day_of_week = :dayOfWeek
            AND cre.teacher_id = :teacherId
            ${excludeRoutineId ? "AND cr.id != :excludeRoutineId" : ""}
          `;

          const [teacherEntries] = await sequelize.query(queryTeacher, {
            replacements: {
              dayOfWeek: entry.day_of_week,
              teacherId,
              excludeRoutineId: excludeRoutineId || 0,
            },
          });

          for (const ex of teacherEntries as any[]) {
            const exStart = this.timeToMinutes(ex.start_time);
            const exEnd = this.timeToMinutes(ex.end_time);

            if (newStart < exEnd && exStart < newEnd) {
              const teacherName = `${ex.first_name || ""} ${ex.last_name || ""}`.trim() || `Teacher #${teacherId}`;
              const exTimeStr = `${this.formatTime12Hour(ex.start_time)} - ${this.formatTime12Hour(ex.end_time)}`;
              conflicts.push({
                type: "TEACHER_DOUBLE_BOOKING",
                message: `Teacher Double-Booking on ${entry.day_of_week}: ${teacherName} is already assigned to ${ex.class_name || "another class"} (${ex.subject_name || "Subject"}) from ${exTimeStr}`,
                day: entry.day_of_week,
                entryIndex: idx,
              });
            }
          }
        } catch (err) {
          console.warn("Teacher conflict check failed:", err);
        }
      }
    }

    return conflicts;
  }

  private static async checkConflicts(
    entries: any[],
    class_id: number,
    tenant: string,
    excludeRoutineId?: number
  ): Promise<void> {
    const conflicts = await this.validateConflicts(entries, class_id, tenant, excludeRoutineId);
    if (conflicts.length > 0) {
      throw new Error(`Conflict: ${conflicts[0].message}`);
    }
  }

  /**
   * Fetch all class routines with optional filters & pagination
   */
  static async getAllRoutines(
    filters: {
      search?: string;
      status?: string;
      class_id?: number;
      academic_year_id?: number;
      page?: number;
      pageSize?: number;
    },
    tenant: string
  ): Promise<{ rows: any[]; count: number }> {
    const { ClassRoutine, ClassRoutineEntry } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const where: any = {};
    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters.class_id) {
      where.class_id = filters.class_id;
    }
    if (filters.academic_year_id) {
      where.academic_year_id = filters.academic_year_id;
    }
    if (filters.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${filters.search}%` } },
        { routine_number: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const { rows, count } = await ClassRoutine.findAndCountAll({
      where,
      include: [
        {
          model: ClassRoutineEntry,
          as: "entries",
        },
      ],
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
      distinct: true,
    });

    // Populate metadata details for classes, academic years, subjects, teachers
    const routinesWithDetails = await Promise.all(
      rows.map(async (r: any) => {
        const plainObj = r.toJSON();

        // Fetch class info
        try {
          const [classRes] = await sequelize.query(
            "SELECT id, code, name FROM classes WHERE id = :class_id LIMIT 1",
            { replacements: { class_id: plainObj.class_id } }
          );
          plainObj.class = classRes[0] || { id: plainObj.class_id, name: `Class #${plainObj.class_id}`, code: "" };
        } catch {
          plainObj.class = { id: plainObj.class_id, name: `Class #${plainObj.class_id}`, code: "" };
        }

        // Fetch academic year info
        try {
          const [yearRes] = await sequelize.query(
            "SELECT id, name AS year_name FROM academic_years WHERE id = :year_id LIMIT 1",
            { replacements: { year_id: plainObj.academic_year_id } }
          );
          plainObj.academic_year = yearRes[0] || { id: plainObj.academic_year_id, year_name: `Year #${plainObj.academic_year_id}` };
        } catch {
          plainObj.academic_year = { id: plainObj.academic_year_id, year_name: `Year #${plainObj.academic_year_id}` };
        }

        return plainObj;
      })
    );

    return { rows: routinesWithDetails, count };
  }

  /**
   * Get single routine with full entry details
   */
  static async getRoutineById(id: number, tenant: string): Promise<any | null> {
    const { ClassRoutine, ClassRoutineEntry } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    const routine = await ClassRoutine.findByPk(id, {
      include: [
        {
          model: ClassRoutineEntry,
          as: "entries",
        },
      ],
    });

    if (!routine) return null;

    const plainObj: any = routine.toJSON();

    // Fetch class info
    try {
      const [classRes] = await sequelize.query(
        "SELECT id, code, name FROM classes WHERE id = :class_id LIMIT 1",
        { replacements: { class_id: plainObj.class_id } }
      );
      plainObj.class = classRes[0] || null;
    } catch {
      plainObj.class = null;
    }

    // Fetch academic year info
    try {
      const [yearRes] = await sequelize.query(
        "SELECT id, name AS year_name FROM academic_years WHERE id = :year_id LIMIT 1",
        { replacements: { year_id: plainObj.academic_year_id } }
      );
      plainObj.academic_year = yearRes[0] || null;
    } catch {
      plainObj.academic_year = null;
    }

    // Populate subject & teacher info for entries
    if (plainObj.entries && plainObj.entries.length > 0) {
      plainObj.entries = await Promise.all(
        plainObj.entries.map(async (entry: any) => {
          let subject = null;
          let teacher = null;

          if (entry.subject_id) {
            try {
              const [subRes] = await sequelize.query(
                "SELECT id, code, name FROM subjects WHERE id = :sub_id LIMIT 1",
                { replacements: { sub_id: entry.subject_id } }
              );
              subject = subRes[0] || null;
            } catch {}
          }

          if (entry.teacher_id) {
            try {
              const [tRes] = await sequelize.query(
                "SELECT id, first_name, last_name, email FROM teachers WHERE id = :t_id LIMIT 1",
                { replacements: { t_id: entry.teacher_id } }
              );
              teacher = tRes[0] || null;
            } catch {}
          }

          return {
            ...entry,
            subject,
            teacher,
          };
        })
      );
    }

    return plainObj;
  }

  /**
   * Create Class Routine with Entries inside a Database Transaction
   */
  private static async ensureNullableColumns(sequelize: any): Promise<void> {
    try {
      await sequelize.query("ALTER TABLE class_routine_entries MODIFY subject_id BIGINT UNSIGNED NULL");
    } catch {}
    try {
      await sequelize.query("ALTER TABLE class_routine_entries MODIFY teacher_id BIGINT UNSIGNED NULL");
    } catch {}
  }

  static async createRoutine(
    data: {
      routine_number: string;
      title: string;
      effective_date: string;
      status?: string;
      class_id: number;
      academic_year_id: number;
      entries?: any[];
    },
    tenant: string
  ): Promise<any> {
    const { ClassRoutine, ClassRoutineEntry } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    await this.ensureNullableColumns(sequelize);

    if (!data.status || data.status === "ACTIVE") {
      await this.checkConflicts(data.entries || [], Number(data.class_id), tenant);
    }

    const transaction = await sequelize.transaction();

    try {
      const routine = await ClassRoutine.create(
        {
          routine_number: data.routine_number,
          title: data.title,
          effective_date: data.effective_date,
          status: data.status || "ACTIVE",
          class_id: Number(data.class_id),
          academic_year_id: Number(data.academic_year_id),
        },
        { transaction }
      );

      if (data.entries && data.entries.length > 0) {
        const entriesToInsert = data.entries.map((entry, idx) => {
          const subId = Number(entry.subject_id || 0);
          const teachId = Number(entry.teacher_id || 0);
          const isBreak = entry.is_break ? 1 : 0;
          return {
            routine_id: routine.id,
            day_of_week: entry.day_of_week,
            period_number: entry.period_number || idx + 1,
            start_time: entry.start_time,
            end_time: entry.end_time,
            subject_id: (!isBreak && subId > 0) ? subId : null,
            teacher_id: (!isBreak && teachId > 0) ? teachId : null,
            is_break: isBreak,
          };
        });

        await ClassRoutineEntry.bulkCreate(entriesToInsert, { transaction });
      }

      await transaction.commit();
      
      // Notify students
      await this.notifyClassRoutine(Number(data.class_id), "New Class Routine", "A new class routine has been published for your class.", tenant);

      // Notify teachers
      if (data.entries && data.entries.length > 0) {
        const teacherIds = Array.from(new Set(data.entries.filter(e => e.teacher_id).map(e => Number(e.teacher_id))));
        if (teacherIds.length > 0) {
          await this.notifyClassRoutineTeachers(teacherIds, "New Class Routine Assignment", "You have been assigned to a new class routine.", tenant);
        }
      }

      return this.getRoutineById(routine.id, tenant);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update Class Routine and period entries inside a Transaction
   */
  static async updateRoutine(
    id: number,
    data: {
      routine_number?: string;
      title?: string;
      effective_date?: string;
      status?: string;
      class_id?: number;
      academic_year_id?: number;
      entries?: any[];
    },
    tenant: string
  ): Promise<any> {
    const { ClassRoutine, ClassRoutineEntry } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    await this.ensureNullableColumns(sequelize);

    const routine = await ClassRoutine.findByPk(id);
    if (!routine) return null;

    const targetStatus = data.status ?? routine.status;
    const targetClassId = data.class_id ? Number(data.class_id) : routine.class_id;
    const targetEntries = data.entries || [];

    if (targetStatus === "ACTIVE" && targetEntries.length > 0) {
      await this.checkConflicts(targetEntries, targetClassId, tenant, id);
    }

    const transaction = await sequelize.transaction();

    try {
      await routine.update(
        {
          routine_number: data.routine_number ?? routine.routine_number,
          title: data.title ?? routine.title,
          effective_date: data.effective_date ?? routine.effective_date,
          status: data.status ?? routine.status,
          class_id: data.class_id ? Number(data.class_id) : routine.class_id,
          academic_year_id: data.academic_year_id ? Number(data.academic_year_id) : routine.academic_year_id,
        },
        { transaction }
      );

      if (data.entries) {
        const existingEntries = await ClassRoutineEntry.findAll({
          where: { routine_id: id },
          transaction,
        });

        const targetEntries = data.entries;
        const handledEntryIds = new Set<number>();

        for (let idx = 0; idx < targetEntries.length; idx++) {
          const entry = targetEntries[idx];
          const periodNum = entry.period_number || idx + 1;
          const day = entry.day_of_week;
          const subId = Number(entry.subject_id || 0);
          const teachId = Number(entry.teacher_id || 0);
          const isBreak = entry.is_break ? 1 : 0;

          // Find existing entry matching day and period
          const existing = existingEntries.find(
            (e: any) => e.day_of_week === day && Number(e.period_number) === Number(periodNum)
          );

          if (existing) {
            await existing.update(
              {
                start_time: entry.start_time,
                end_time: entry.end_time,
                subject_id: !isBreak && subId > 0 ? subId : null,
                teacher_id: !isBreak && teachId > 0 ? teachId : null,
                is_break: isBreak,
              },
              { transaction }
            );
            handledEntryIds.add(existing.id);
          } else {
            const created = await ClassRoutineEntry.create(
              {
                routine_id: id,
                day_of_week: day,
                period_number: periodNum,
                start_time: entry.start_time,
                end_time: entry.end_time,
                subject_id: !isBreak && subId > 0 ? subId : null,
                teacher_id: !isBreak && teachId > 0 ? teachId : null,
                is_break: isBreak,
              },
              { transaction }
            );
            handledEntryIds.add(created.id);
          }
        }

        // For any existing entries that were NOT in the new entries list:
        // Only delete them if they are NOT referenced by any attendance sessions
        const unhandled = existingEntries.filter((e: any) => !handledEntryIds.has(e.id));
        for (const unhandledEntry of unhandled) {
          try {
            const [attCheck]: any = await sequelize.query(
              `SELECT id FROM attendance_sessions WHERE routine_entry_id = :entryId LIMIT 1`,
              { replacements: { entryId: unhandledEntry.id }, transaction }
            );
            if (!attCheck || attCheck.length === 0) {
              await unhandledEntry.destroy({ transaction });
            }
          } catch {
            // Ignore if check fails
          }
        }
      }

      await transaction.commit();
      
      // Notify students
      const finalClassId = data.class_id ? Number(data.class_id) : routine.class_id;
      await this.notifyClassRoutine(finalClassId, "Class Routine Updated", "The class routine for your class has been updated.", tenant);

      // Notify teachers
      if (data.entries && data.entries.length > 0) {
        const teacherIds = Array.from(new Set(data.entries.filter(e => e.teacher_id).map(e => Number(e.teacher_id))));
        if (teacherIds.length > 0) {
          await this.notifyClassRoutineTeachers(teacherIds, "Class Routine Updated", "A class routine you are assigned to has been updated.", tenant);
        }
      }

      return this.getRoutineById(id, tenant);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Fetch Active Student Routine (Strictly for the student's enrolled class)
   */
  static async getStudentRoutine(
    filters: { class_id?: number; academic_year_id?: number; userId?: number; email?: string; username?: string },
    tenant: string
  ): Promise<any> {
    const { ClassRoutine, ClassRoutineEntry } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    let targetClassId = filters.class_id;

    // If class_id was not explicitly passed, resolve class_id strictly for the logged-in student user
    if (!targetClassId) {
      try {
        const replacements: any = {
          userId: filters.userId || 0,
          email: filters.email || "",
          username: filters.username || ""
        };

        const [stRes] = await sequelize.query(`
          SELECT COALESCE(spd.class_id, c.id) AS class_id
          FROM students s
          LEFT JOIN student_personal_details spd ON (spd.student_id = s.id OR spd.user_id = s.user_id)
          LEFT JOIN classes c ON c.semester_id = s.semester_id
          WHERE (
            s.user_id = :userId 
            OR s.id = :userId 
            OR (s.email IS NOT NULL AND s.email = :email AND :email != '')
            OR (s.student_id IS NOT NULL AND s.student_id = :username AND :username != '')
          )
          AND (spd.class_id IS NOT NULL OR c.id IS NOT NULL)
          LIMIT 1
        `, { replacements });

        if (stRes && stRes[0] && (stRes[0] as any).class_id) {
          targetClassId = (stRes[0] as any).class_id;
        }
      } catch (err) {
        console.warn("Could not resolve student class_id for user", err);
      }
    }

    // If targetClassId is not provided or resolved for this specific user, return null
    if (!targetClassId) {
      return null;
    }

    const whereClause: any = { status: "ACTIVE", class_id: targetClassId };

    if (filters.academic_year_id) {
      whereClause.academic_year_id = filters.academic_year_id;
    }

    const routine = await ClassRoutine.findOne({
      where: whereClause,
      include: [
        {
          model: ClassRoutineEntry,
          as: "entries",
        },
      ],
      order: [["id", "DESC"]],
    });

    if (!routine) {
      return null;
    }

    return this.getRoutineById(routine.id, tenant);
  }

  /**
   * Delete Class Routine
   */
  static async deleteRoutine(id: number, tenant: string): Promise<boolean> {
    const { ClassRoutine, ClassRoutineEntry } = getTenantModels(tenant);
    const routine = await ClassRoutine.findOne({
      where: { id },
      include: [{ model: ClassRoutineEntry, as: "entries" }]
    });
    if (!routine) return false;

    const classId = routine.class_id;
    const teacherIds: number[] = Array.from(new Set(((routine as any).entries || []).filter((e: any) => e.teacher_id).map((e: any) => Number(e.teacher_id))));

    const count = await ClassRoutine.destroy({ where: { id } });

    if (count > 0) {
      await this.notifyClassRoutine(classId, "Class Routine Removed", "The class routine for your class has been removed.", tenant);
      if (teacherIds.length > 0) {
        await this.notifyClassRoutineTeachers(teacherIds, "Class Routine Removed", "A class routine you were assigned to has been removed.", tenant);
      }
    }
    return count > 0;
  }

  /**
   * Fetch Dropdown Metadata: Classes, Academic Years, Subjects, Teachers
   */
  static async getRoutineMetaData(tenant: string): Promise<{
    classes: any[];
    academic_years: any[];
    subjects: any[];
    teachers: any[];
  }> {
    const sequelize = getTenantSequelize(tenant);

    let classes: any[] = [];
    let academic_years: any[] = [];
    let subjects: any[] = [];
    let teachers: any[] = [];

    try {
      const [res] = await sequelize.query("SELECT id, code, name FROM classes ORDER BY name ASC");
      classes = res;
    } catch {}

    try {
      const [res] = await sequelize.query(
        "SELECT id, name AS year_name FROM academic_years ORDER BY id DESC"
      );
      academic_years = res;
    } catch {
      try {
        const [resFallback] = await sequelize.query("SELECT id, name FROM academic_years ORDER BY id DESC");
        academic_years = resFallback.map((y: any) => ({ id: y.id, year_name: y.name || `Academic Year #${y.id}` }));
      } catch {}
    }

    try {
      const [res] = await sequelize.query("SELECT id, code, name FROM subjects ORDER BY name ASC");
      subjects = res;
    } catch {}

    try {
      const [res] = await sequelize.query("SELECT id, employee_id, first_name, last_name, email FROM teachers ORDER BY first_name ASC");
      teachers = res;
    } catch {}

    return { classes, academic_years, subjects, teachers };
  }

  /**
   * Fetch Active Teacher Routine
   */
  static async getTeacherSchedule(
    filters: { day_of_week?: string; userId?: number; email?: string; username?: string },
    tenant: string
  ): Promise<any[]> {
    const sequelize = getTenantSequelize(tenant);

    let teacherId = null;

    try {
      const replacements: any = {
        userId: filters.userId || 0,
        email: filters.email || "",
        username: filters.username || ""
      };

      const [tRes] = await sequelize.query(`
        SELECT id
        FROM teachers
        WHERE user_id = :userId 
        OR (email IS NOT NULL AND email = :email AND :email != '')
        OR (employee_id IS NOT NULL AND employee_id = :username AND :username != '')
        LIMIT 1
      `, { replacements });

      if (tRes && tRes[0] && (tRes[0] as any).id) {
        teacherId = (tRes[0] as any).id;
      }
    } catch (err) {
      console.warn("Could not resolve teacher_id for user", err);
    }

    if (!teacherId) return [];

    try {
      const query = `
        SELECT 
          cre.id,
          cre.routine_id,
          cre.day_of_week,
          cre.period_number,
          cre.start_time,
          cre.end_time,
          cre.subject_id,
          cre.teacher_id,
          cre.is_break,
          s.id AS subject_id_ref,
          s.name AS subject_name,
          s.code AS subject_code,
          c.id AS class_id_ref,
          c.name AS class_name,
          c.code AS class_code
        FROM class_routine_entries cre
        JOIN class_routines cr ON cr.id = cre.routine_id
        LEFT JOIN subjects s ON s.id = cre.subject_id
        LEFT JOIN classes c ON c.id = cr.class_id
        WHERE (
          cre.teacher_id = :teacherId 
          OR (
            cre.is_break = 1 
            AND cr.id IN (
              SELECT DISTINCT routine_id 
              FROM class_routine_entries 
              WHERE teacher_id = :teacherId
            )
          )
        )
        ${filters.day_of_week ? 'AND cre.day_of_week = :dayOfWeek' : ''}
        AND cr.status = 'ACTIVE'
        ORDER BY cre.day_of_week, cre.start_time
      `;

      const replacements: any = { teacherId };
      if (filters.day_of_week) {
        replacements.dayOfWeek = filters.day_of_week;
      }

      const [entries] = await sequelize.query(query, { replacements });
      
      const uniqueEntriesMap = new Map();
      (entries as any[]).forEach(e => {
        const key = `${e.day_of_week}_${e.start_time}_${e.class_name}`;
        if (!uniqueEntriesMap.has(key)) {
          uniqueEntriesMap.set(key, e);
        }
      });
      const uniqueEntries = Array.from(uniqueEntriesMap.values());
      
      return uniqueEntries.map(e => ({
        id: e.id,
        routine_id: e.routine_id,
        day_of_week: e.day_of_week,
        period_number: e.period_number,
        start_time: e.start_time,
        end_time: e.end_time,
        subject_id: e.subject_id,
        teacher_id: e.teacher_id,
        is_break: e.is_break,
        subject: {
          id: e.subject_id_ref || e.subject_id,
          name: e.subject_name,
          code: e.subject_code
        },
        class: {
          id: e.class_id_ref,
          name: e.class_name,
          code: e.class_code
        }
      }));
    } catch (err) {
       console.error("Error fetching teacher schedule:", err);
       return [];
    }
  }

}