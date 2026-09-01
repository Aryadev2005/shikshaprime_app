import { NextFunction, Request, Response } from "express";
import { ClassRoutineService } from "../services/classRoutineService";

export class ClassRoutineController {
  /**
   * Get all class routines with optional filters & pagination
   */
  static async getAllRoutines(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "ALL";
      const class_id = req.query.class_id ? parseInt(req.query.class_id as string) : undefined;
      const academic_year_id = req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined;

      const { rows, count } = await ClassRoutineService.getAllRoutines(
        { page, pageSize, search, status, class_id, academic_year_id },
        req.tenant
      );

      res.status(200).json({
        status: 1,
        data: {
          data: rows,
          pagination: {
            currentPage: page,
            pageSize,
            totalRecords: count,
            totalPages: Math.ceil(count / pageSize),
          },
        },
        message: "Class routines fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single routine by ID
   */
  static async getRoutineById(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const routine = await ClassRoutineService.getRoutineById(parseInt(String(id)), req.tenant);

      if (!routine) {
        res.status(404).json({ status: 0, message: "Class routine not found" });
        return;
      }

      res.status(200).json({
        status: 1,
        data: routine,
        message: "Class routine fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new class routine
   */
  static async createRoutine(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { routine_number, title, effective_date, status, class_id, academic_year_id, entries } = req.body;

      if (!routine_number || !title || !effective_date || !class_id || !academic_year_id) {
        res.status(400).json({
          status: 0,
          message: "Required fields missing: routine_number, title, effective_date, class_id, academic_year_id",
        });
        return;
      }

      const routine = await ClassRoutineService.createRoutine(
        { routine_number, title, effective_date, status, class_id, academic_year_id, entries },
        req.tenant
      );

      res.status(201).json({
        status: 1,
        data: routine,
        message: "Class routine created successfully",
      });
    } catch (error: any) {
      console.error("Error creating routine:", error);
      if (error?.name === "SequelizeUniqueConstraintError") {
        res.status(400).json({ status: 0, message: "Routine number already exists" });
        return;
      }
      if (error?.message && error.message.includes("Conflict:")) {
        res.status(400).json({ status: 0, message: error.message.replace("Conflict: ", "") });
        return;
      }
      res.status(400).json({
        status: 0,
        message: error?.message || "Failed to create class routine. Please check required fields.",
      });
    }
  }

  /**
   * Update existing class routine
   */
  static async updateRoutine(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await ClassRoutineService.updateRoutine(
        parseInt(String(id)),
        req.body,
        req.tenant
      );

      if (!updated) {
        res.status(404).json({ status: 0, message: "Class routine not found" });
        return;
      }

      res.status(200).json({
        status: 1,
        data: updated,
        message: "Class routine updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating routine:", error);
      if (error?.name === "SequelizeUniqueConstraintError") {
        res.status(400).json({ status: 0, message: "Routine number already exists" });
        return;
      }
      if (error?.message && error.message.includes("Conflict:")) {
        res.status(400).json({ status: 0, message: error.message.replace("Conflict: ", "") });
        return;
      }
      res.status(400).json({
        status: 0,
        message: error?.message || "Failed to update class routine. Please check required fields.",
      });
    }
  }

  /**
   * Delete class routine
   */
  static async deleteRoutine(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ClassRoutineService.deleteRoutine(parseInt(String(id)), req.tenant);

      if (!deleted) {
        res.status(404).json({ status: 0, message: "Class routine not found" });
        return;
      }

      res.status(200).json({
        status: 1,
        message: "Class routine deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get metadata options for dropdowns (Classes, Academic Years, Subjects, Teachers)
   */
  static async getRoutineMetaData(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const metadata = await ClassRoutineService.getRoutineMetaData(req.tenant);

      res.status(200).json({
        status: 1,
        data: metadata,
        message: "Routine metadata fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student's class routine schedule
   */
  static async getStudentRoutine(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const class_id = req.query.class_id ? parseInt(req.query.class_id as string) : undefined;
      const academic_year_id = req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined;
      const userId = req.user?.id || req.user?.user_id || req.user?.sub;
      const email = req.user?.email;
      const username = req.user?.username || req.user?.student_id;

      const routine = await ClassRoutineService.getStudentRoutine(
        { class_id, academic_year_id, userId, email, username },
        req.tenant
      );

      res.status(200).json({
        status: 1,
        data: routine,
        message: "Student routine fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get teacher's assigned schedule
   */
  static async getTeacherRoutine(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const day_of_week = req.query.day_of_week as string | undefined;
      const userId = req.user?.id || req.user?.user_id || req.user?.sub;
      const email = req.user?.email;
      const username = req.user?.username || req.user?.employee_id;

      const schedule = await ClassRoutineService.getTeacherSchedule(
        { day_of_week, userId, email, username },
        req.tenant
      );

      res.status(200).json({
        status: 1,
        data: schedule,
        message: "Teacher schedule fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate potential conflicts without saving
   */
  static async validateConflicts(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entries, class_id, exclude_routine_id } = req.body;
      const conflicts = await ClassRoutineService.validateConflicts(
        entries || [],
        Number(class_id || 0),
        req.tenant,
        exclude_routine_id ? Number(exclude_routine_id) : undefined
      );

      res.status(200).json({
        status: 1,
        data: {
          hasConflicts: conflicts.length > 0,
          conflicts,
        },
        message: conflicts.length > 0 ? "Conflicts detected" : "No conflicts detected",
      });
    } catch (error) {
      next(error);
    }
  }
}
