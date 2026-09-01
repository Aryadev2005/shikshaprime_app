import { getTenantModels } from "../models";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { LearningMaterialAttributes } from "../models/learningMaterials";

export interface MaterialFilters {
  department_id?: number;
  program_id?: number;
  academic_year_id?: number;
  class_id?: number;
  semester_id?: number;
  subject_id?: number;
  is_active?: boolean;
}

export const create = async (tenant: string, payload: Partial<LearningMaterialAttributes>) => {
  const { LearningMaterial } = getTenantModels(tenant);
  return await LearningMaterial.create(payload as any);
};

export const getAll = async (tenant: string, filters: MaterialFilters) => {
  const { QueryTypes } = require("sequelize");
  const { getTenantSequelize } = require("../server");
  const sequelize = getTenantSequelize(tenant);

  let sql = `
    SELECT 
      lm.id, lm.title, lm.description, 
      lm.department_id, lm.program_id, lm.academic_year_id, 
      lm.class_id, lm.semester_id, lm.subject_id,
      lm.material_type, lm.file_name, lm.file_path, lm.file_size, lm.mime_type,
      lm.uploaded_by, lm.is_active, lm.created_at, lm.updated_at,
      d.name AS department_name,
      p.name AS program_name,
      ay.name AS academic_year_name,
      c.name AS class_name,
      s.name AS semester_name, s.semester_number,
      sub.name AS subject_name
    FROM learning_materials lm
    LEFT JOIN departments d ON d.id = lm.department_id
    LEFT JOIN programs p ON p.id = lm.program_id
    LEFT JOIN academic_years ay ON ay.id = lm.academic_year_id
    LEFT JOIN classes c ON c.id = lm.class_id
    LEFT JOIN semesters s ON s.id = lm.semester_id
    LEFT JOIN subjects sub ON sub.id = lm.subject_id
    WHERE lm.is_active = 1
  `;

  const replacements: Record<string, any> = {};

  if (filters.department_id) {
    sql += ` AND lm.department_id = :department_id`;
    replacements.department_id = filters.department_id;
  }
  if (filters.program_id) {
    sql += ` AND lm.program_id = :program_id`;
    replacements.program_id = filters.program_id;
  }
  if (filters.academic_year_id) {
    sql += ` AND lm.academic_year_id = :academic_year_id`;
    replacements.academic_year_id = filters.academic_year_id;
  }
  if (filters.class_id) {
    sql += ` AND lm.class_id = :class_id`;
    replacements.class_id = filters.class_id;
  }
  if (filters.semester_id) {
    sql += ` AND lm.semester_id = :semester_id`;
    replacements.semester_id = filters.semester_id;
  }
  if (filters.subject_id) {
    sql += ` AND lm.subject_id = :subject_id`;
    replacements.subject_id = filters.subject_id;
  }

  sql += ` ORDER BY lm.created_at DESC`;

  return await sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT
  });
};

export const getStudentMaterials = async (tenant: string, studentId: number) => {
  const { QueryTypes } = require("sequelize");
  const { getTenantSequelize } = require("../server");
  const sequelize = getTenantSequelize(tenant);

  // 1. Get student's hierarchy info, supporting both student_id and user_id links
  const [student] = await sequelize.query(
    `SELECT 
      s.id,
      s.user_id,
      COALESCE(sp.program_id, sp_alt.program_id) AS program_id,
      p.department_id,
      COALESCE(sp.class_id, sp_alt.class_id) AS class_id,
      s.semester_id,
      COALESCE(sp.academic_year_id, sp_alt.academic_year_id) AS academic_year_id
    FROM students s
    LEFT JOIN student_personal_details sp
      ON sp.student_id = s.id
    LEFT JOIN student_personal_details sp_alt
      ON sp_alt.user_id = s.user_id
    LEFT JOIN programs p
      ON p.id = COALESCE(sp.program_id, sp_alt.program_id)
    WHERE s.id = :studentId
    LIMIT 1`,
    { replacements: { studentId }, type: QueryTypes.SELECT });

  if (!student || !student.program_id || !student.class_id || !student.semester_id || !student.academic_year_id) {
    return [];
  }

  // 2. Get the student's assigned subject IDs from student_subjects
  const assignedSubjects = await sequelize.query(
    `SELECT subject_id FROM student_subjects 
     WHERE student_id = :studentId AND semester_id = :semesterId`,
    { replacements: { studentId: student.id, semesterId: student.semester_id }, type: QueryTypes.SELECT }
  );

  const subjectIds = assignedSubjects.map((s: any) => s.subject_id);

  // 3. Fetch matching learning materials with entity names.
  // If no subject assignments exist, still return materials matching the cohort hierarchy.
  const replacements: Record<string, any> = {
    departmentId: student.department_id,
    programId: student.program_id,
    classId: student.class_id,
    semesterId: student.semester_id,
    academicYearId: student.academic_year_id,
  };

  let sql = `
    SELECT 
      lm.id, lm.title, lm.description,
      lm.department_id, lm.program_id, lm.academic_year_id,
      lm.class_id, lm.semester_id, lm.subject_id,
      lm.material_type, lm.file_name, lm.file_path, lm.file_size, lm.mime_type,
      lm.uploaded_by, lm.is_active, lm.created_at, lm.updated_at,
      d.name AS department_name,
      p.name AS program_name,
      ay.name AS academic_year_name,
      c.name AS class_name,
      s.name AS semester_name, s.semester_number,
      sub.name AS subject_name
    FROM learning_materials lm
    LEFT JOIN departments d ON d.id = lm.department_id
    LEFT JOIN programs p ON p.id = lm.program_id
    LEFT JOIN academic_years ay ON ay.id = lm.academic_year_id
    LEFT JOIN classes c ON c.id = lm.class_id
    LEFT JOIN semesters s ON s.id = lm.semester_id
    LEFT JOIN subjects sub ON sub.id = lm.subject_id
    WHERE lm.is_active = 1
      AND lm.department_id = :departmentId
      AND lm.program_id = :programId
      AND lm.class_id = :classId
      AND lm.semester_id = :semesterId
      AND lm.academic_year_id = :academicYearId`;

  if (subjectIds.length > 0) {
    sql += ` AND lm.subject_id IN (:subjectIds)`;
    replacements.subjectIds = subjectIds;
  }

  sql += ` ORDER BY lm.created_at DESC`;

  const materials = await sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT
  });

  return materials;
}

export const getById = async (tenant: string, id: number, checkActive = true) => {
  const { LearningMaterial } = getTenantModels(tenant);
  const where: any = { id };
  if (checkActive) where.is_active = true;

  return await LearningMaterial.findOne({ where });
};

export const update = async (tenant: string, id: number, payload: Record<string, any>) => {
  const { QueryTypes } = require("sequelize");
  const { getTenantSequelize } = require("../server");
  const sequelize = getTenantSequelize(tenant);

  // Check material exists
  const [existing] = await sequelize.query(
    `SELECT id, file_path FROM learning_materials WHERE id = :id AND is_active = 1 LIMIT 1`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  if (!existing) throw new Error("Learning material not found or inactive");

  // Build dynamic SET clause
  const allowedFields = [
    "title", "description", "department_id", "program_id", "academic_year_id",
    "class_id", "semester_id", "subject_id", "material_type",
    "file_name", "file_path", "file_size", "mime_type"
  ];

  const setClauses: string[] = [];
  const replacements: Record<string, any> = { id };

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      setClauses.push(`${field} = :${field}`);
      replacements[field] = payload[field];
    }
  }

  if (setClauses.length === 0) throw new Error("No valid fields to update");

  setClauses.push("updated_at = NOW()");

  await sequelize.query(
    `UPDATE learning_materials SET ${setClauses.join(", ")} WHERE id = :id`,
    { replacements, type: QueryTypes.UPDATE }
  );

  // Return old file path for cleanup if file was replaced
  return { id, updated: true, oldFilePath: existing.file_path };
};

export const softDelete = async (tenant: string, id: number) => {
  const { QueryTypes } = require("sequelize");
  const { getTenantSequelize } = require("../server");
  const sequelize = getTenantSequelize(tenant);

  const [material] = await sequelize.query(
    `SELECT id FROM learning_materials WHERE id = :id LIMIT 1`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  if (!material) throw new Error("Learning material not found");

  await sequelize.query(
    `UPDATE learning_materials SET is_active = 0 WHERE id = :id`,
    { replacements: { id }, type: QueryTypes.UPDATE }
  );

  return { id, is_active: false };
};

export const permanentDelete = async (tenant: string, id: number) => {
  const { QueryTypes } = require("sequelize");
  const { getTenantSequelize } = require("../server");
  const sequelize = getTenantSequelize(tenant);

  // Get file_path before deleting the row
  const [material] = await sequelize.query(
    `SELECT id, file_path FROM learning_materials WHERE id = :id LIMIT 1`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  if (!material) throw new Error("Learning material not found");

  // File cleanup
  if (material.file_path) {
    const absolutePath = path.resolve(material.file_path);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error(`Failed to delete file at ${absolutePath}:`, err);
      }
    }
  }

  // Permanently delete the row
  await sequelize.query(
    `DELETE FROM learning_materials WHERE id = :id`,
    { replacements: { id }, type: QueryTypes.DELETE }
  );

  return { id, deleted: true };
};
