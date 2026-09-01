import { Response } from "express";
import { QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";

export const hierarchyController = {
  getDepartments: async (req, res: Response) => {
    try {
      const sequelize = getTenantSequelize(req.tenant);
      const departments = await sequelize.query(
        `SELECT id, parent_id, code, name, level FROM departments ORDER BY name`,
        { type: QueryTypes.SELECT }
      );

      return res.status(200).json({
        success: true,
        message: "Departments fetched successfully",
        data: departments
      });
    } catch (error: any) {
      console.error("[hierarchy] getDepartments error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getPrograms: async (req, res: Response) => {
    try {
      const tenant = req.tenant || (req.headers["x-tenant"] as string);
      if (!tenant) return res.status(400).json({ success: false, message: "Tenant is required" });

      const { department_id } = req.query;

      let sql = `SELECT id, department_id, code, name, degree_type, duration_years FROM programs`;
      const replacements: Record<string, any> = {};

      if (department_id && Number(department_id) > 0) {
        sql += ` WHERE department_id = :department_id`;
        replacements.department_id = Number(department_id);
      }

      sql += ` ORDER BY name`;

      const sequelize = getTenantSequelize(tenant);
      const programs = await sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
      });

      return res.status(200).json({
        success: true,
        message: "Programs fetched successfully",
        data: programs
      });
    } catch (error: any) {
      console.error("[hierarchy] getPrograms error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getClasses: async (req, res: Response) => {
    try {
      let sql = `SELECT id, code, name FROM classes`;
      sql += ` ORDER BY id`;

      const sequelize = getTenantSequelize(req.tenant);
      const classes = await sequelize.query(sql, {
        type: QueryTypes.SELECT
      });

      return res.status(200).json({
        success: true,
        message: "Classes fetched successfully",
        data: classes
      });
    } catch (error: any) {
      console.error("[hierarchy] getClasses error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getSemesters: async (req, res: Response) => {
    try {
      const { program_id, class_id } = req.query;
      const classId = Number(class_id);
      const programId = Number(program_id);

      const sequelize = getTenantSequelize(req.tenant);
      const replacements: Record<string, any> = {};

      let sql = `
        SELECT distinct
          sem.id,
          sem.semester_number,
          sem.name
        FROM semesters sem
      `;

      if (classId > 0) {
        replacements.class_id = classId;
        sql += ` INNER JOIN classes c ON c.semester_id = sem.id WHERE c.id = :class_id`;
      } else {
        sql += ` WHERE 1=1`;
      }

      if (programId > 0) {
        replacements.program_id = programId;
        if (classId > 0) {
            sql += ` AND c.program_id = :program_id`;
        } else {
            sql += ` AND sem.program_id = :program_id`;
        }
      }

      sql += ` ORDER BY sem.semester_number;`;

      const semesters = await sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
      });

      return res.status(200).json({
        success: true,
        message: "Semesters fetched successfully",
        data: semesters
      });

    } catch (error: any) {
      console.error("[hierarchy] getSemesters error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getSubjects: async (req, res: Response) => {
    try {
      const { department_id } = req.query;

      let sql = `SELECT id, code, name FROM subjects`;
      const conditions: string[] = [];
      const replacements: Record<string, any> = {};

      if (department_id && Number(department_id) > 0) {
        conditions.push(`department_id = :department_id`);
        replacements.department_id = Number(department_id);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(` AND `);
      }

      sql += ` ORDER BY name`;

      const sequelize = getTenantSequelize(req.tenant);
      const subjects = await sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
      });

      return res.status(200).json({
        success: true,
        message: "Subjects fetched successfully",
        data: subjects
      });
    } catch (error: any) {
      console.error("[hierarchy] getSubjects error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getAcademicYears: async (req, res: Response) => {
    try {
      const sequelize = getTenantSequelize(req.tenant);
      const years = await sequelize.query(
        `SELECT id, name, start_date, end_date, is_active FROM academic_years ORDER BY start_date DESC`,
        { type: QueryTypes.SELECT }
      );

      return res.status(200).json({
        success: true,
        message: "Academic years fetched successfully",
        data: years
      });
    } catch (error: any) {
      console.error("[hierarchy] getAcademicYears error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
