import { Op } from "sequelize";
import { getTenantModels } from "../models";
import { AppError } from "../utils/appError";
import { isPositiveNumber, isValidEnum, requireFields } from "../utils/validators";
import { getTenantSequelize } from "../server";

export enum ComponentType {
  THEORY = "THEORY",
  PRACTICAL = "PRACTICAL",
  PROJECT = "PROJECT",
  VIVA = "VIVA",
  ASSIGNMENT = "ASSIGNMENT",
  ORAL = "ORAL",
}

export class ExamComponentService {

  async getAllTemplates(tenant: string) {
    const { ExamComponentTemplate } = getTenantModels(tenant);
    return ExamComponentTemplate.findAll({ order: [["componentName", "ASC"]] });
  }
  async createComponentTemplate(data: any, tenant: string) {
    requireFields(data, [
      "componentName",
      "componentType",
      "defaultDuration",
      "defaultWeightage",
    ]);
    
    isValidEnum(
      data.componentType,
      Object.values(ComponentType),
      "componentType"
    );
    isPositiveNumber(data.defaultDuration, "defaultDuration");
    isPositiveNumber(data.defaultWeightage, "defaultWeightage");

    const { ExamComponentTemplate } = getTenantModels(tenant);

    // Verify exam exists
    // const exam = await Exam.findOne({ where: { id: data.exam_id } });
    // if (!exam) throw new AppError("Exam not found", 404);

    // // Validate min_marks < max_marks
    // if (data.min_marks !== undefined && data.min_marks !== null) {
    //   if (Number(data.min_marks) > Number(data.max_marks)) {
    //     throw new AppError(
    //       "min_marks cannot be greater than max_marks",
    //       400
    //     );
    //   }
    // }

    // Get next sequence number if not provided
    // let sequence = data.sequence;
    // if (sequence === undefined || sequence === null) {
    //   const lastComponent = await ExamComponent.findOne({
    //     where: { exam_id: data.exam_id },
    //     order: [["sequence", "DESC"]],
    //   });
    //   sequence = lastComponent ? Number(lastComponent.get("sequence")) + 1 : 1;
    // }

    const component = await ExamComponentTemplate.create({
      componentName: data.componentName,
      componentType: data.componentType,
      defaultWeightage: data.defaultWeightage,
      defaultDuration: data.defaultDuration,
      isActive: 1,
    });

    return component;
  }

  // ── List by Exam ──────────────────────────────────────────────────────────
  async getComponentsByExamId(examId: string, tenant: string) {
    const { ExamComponentTemplate, Exam, ExamComponentMapping } = getTenantModels(tenant);

    // Verify exam exists
    const exam = await Exam.findOne({ where: { id: examId } });
    if (!exam) throw new AppError("Exam not found", 404);

    // 2. Fetch all mapped components for this exam
    const mappings = await ExamComponentMapping.findAll({
      where: { examId },
      include: [
        {
          model: ExamComponentTemplate,
          as: "template",
          attributes: [
            "id",
            "componentName",
            "componentType",
            "defaultDuration",
            "defaultWeightage",
            "isActive"
          ]
        }
      ],
      order: [["sequence", "ASC"]]
    });
    // 3. Transform into clean API response
    const components = mappings.map((m: any) => ({
      mappingId: m.id,
      examId: m.examId,
      componentTemplateId: m.componentTemplateId,

      // Template info
      template: {
        id: m.template.id,
        name: m.template.componentName,
        type: m.template.componentType,
        defaultDuration: m.template.defaultDuration,
        defaultWeightage: m.template.defaultWeightage,
        isActive: m.template.isActive
      },
      // Exam-specific overrides
      maxMarks: m.maxMarks,
      minMarks: m.minMarks,
      weightage: m.weightage,
      durationMinutes: m.durationMinutes,
      sequence: m.sequence,
      passRequired: m.passRequired
    }));
    console.log(components);
    return components;
  }

  // ── Get by ID ─────────────────────────────────────────────────────────────
  async getComponentTemplateById(id: string, tenant: string) {
    const { ExamComponentTemplate } = getTenantModels(tenant);
    const template = await ExamComponentTemplate.findOne({ where: { id } });
    if (!template) throw new AppError("Exam component template not found", 404);
    return template;
  }

  // ── Update ────────────────────────────────────────────────────────────────
  async updateComponentTemplate(id: string, data: any, tenant: string) {
    const { ExamComponentTemplate } = getTenantModels(tenant);
    const template = await ExamComponentTemplate.findOne({ where: { id } });
    if (!template) throw new AppError("Exam component template not found", 404);

    // Validate component_type if provided
    if (data.component_type)
      isValidEnum(
        data.component_type,
        Object.values(ComponentType),
        "component_type"
      );

    // Validate duration if provided
    if (data.duration) isPositiveNumber(data.duration, "max_marks");

    // Validate weightage if provided
    if (data.weightage) isPositiveNumber(data.weightage, "weightage");   

    await template.update(data);
    return template;
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async deleteComponentTemplate(id: string, tenant: string) {
    const { ExamComponentTemplate } = getTenantModels(tenant);
    const component = await ExamComponentTemplate.findOne({ where: { id } });
    if (!component) throw new AppError("Exam component template not found", 404);
    await component.destroy();
    return { message: "Exam component template deleted successfully" };
  }

  async addComponentToExam(examId: string, data, tenant: string) {
    const { Exam, ExamComponentTemplate, ExamComponentMapping } = getTenantModels(tenant);

    const exam = await Exam.findByPk(examId);
    if (!exam) throw new AppError("Exam not found", 404);

    const template = await ExamComponentTemplate.findByPk(data.componentTemplateId);
    if (!template) throw new AppError("Template not found", 404);

    const exists = await ExamComponentMapping.findOne({
      where: {
        examId,
        componentTemplateId: data.componentTemplateId
      }
    });

    if (exists) {
      throw new AppError("This template is already mapped to the exam", 400);
    }

    // Validate min_marks < max_marks
    const maxMarks = data.max_marks || template.get("max_marks");
    const minMarks = data.min_marks !== undefined ? data.min_marks : template.get("min_marks");

    if (Number(minMarks) > Number(maxMarks)) {
       throw new AppError("min_marks cannot be greater than max_marks", 400);
    }

    const last = await ExamComponentMapping.max("sequence", { where: { examId } });

    return ExamComponentMapping.create({
      examId: Number(examId),
      componentTemplateId: data.componentTemplateId,
      maxMarks: data.maxMarks,
      minMarks: data.minMarks,
      weightage: data.weightage,
      durationMinutes: data.durationMinutes,
      passRequired: data.passRequired,
      sequence: last ? Number(last) + 1 : 1,
    });
  }
  async updateComponentMapping(mappingId: string, data, tenant: string) {
    const { ExamComponentMapping } = getTenantModels(tenant);

    const mapping = await ExamComponentMapping.findByPk(mappingId);
    if (!mapping) throw new AppError("Component mapping not found", 404);

    return mapping.update(data);
  }
  async deleteComponentMapping(examId: string, templateId: string, tenant: string) {
    const { ExamComponentMapping } = getTenantModels(tenant);

    // Find mapping by examId + templateId
    const mapping = await ExamComponentMapping.findOne({
      where: {
        examId,
        componentTemplateId: templateId
      }
    });

    if (!mapping) {
      throw new AppError("Component mapping not found", 404);
    }
    await mapping.destroy();
    return { message: "Component mapping deleted", id: mapping.id };
  }


  // ── Reorder Components ────────────────────────────────────────────────────
  async reorderComponents(examId: string, templateIds: string[], tenant: string) {
    const { Exam, ExamComponentMapping } = getTenantModels(tenant);

    // 1. Verify exam exists
    const exam = await Exam.findOne({ where: { id: examId } });
    if (!exam) throw new AppError("Exam not found", 404);

    // 2. Fetch all mappings for this exam
    const mappings = await ExamComponentMapping.findAll({
      where: { examId },
    });

    // Build map: templateId → mapping instance
    const mappingMap = new Map(
      mappings.map((m: any) => [String(m.componentTemplateId), m])
    );

    // 3. Validate all provided templateIds belong to this exam
    for (const templateId of templateIds) {
      if (!mappingMap.has(String(templateId))) {
        throw new AppError(
          `Component template ${templateId} does not belong to exam ${examId}`,
          400
        );
      }
    }

    // 4. Update sequence in the order provided
    for (let i = 0; i < templateIds.length; i++) {
      const mapping = mappingMap.get(String(templateIds[i]));
      await mapping.update({ sequence: i + 1 });
    }

    return { message: "Components reordered successfully" };
  }
  async getTeacherExamComponents(
    tenant: string,
    examId: number,
    teacherId: number
  ) {
    const {
      ExamExaminer,
      ExamComponentMapping,
      ExamComponentTemplate,
      ExamMark
    } = getTenantModels(tenant);

    // Step 1: Ensure teacher is assigned as examiner
    const isExaminer = await ExamExaminer.findOne({
      where: { exam_id: examId, teacher_id: teacherId, is_active: 1 }
    });

    if (!isExaminer) {
      throw new Error("You are not assigned as examiner for this exam");
    }

    // Step 2: Fetch all component mappings for this exam
    const mappings: any = await ExamComponentMapping.findAll({
      where: { examId: examId },
      include: [
        {
          model: ExamComponentTemplate,
          as: "template",
          attributes: [
            "id",
            "componentName",
            "componentType",
            "defaultWeightage",
            "defaultDuration",
            "isActive"
          ]
        }
      ],
      order: [["sequence", "ASC"]]
    });

    // Step 3: Fetch marks to check if component is already evaluated
    const marks = await ExamMark.findAll({
      where: { exam_id: examId },
      attributes: ["component_mapping_id"],
    });

    const marksMap = new Set(marks.map((m) => m.component_mapping_id));

    // Step 4: Build response
    return mappings.map((m) => ({
      mapping_id: m.id,
      template_id: m.componentTemplateId,
      component_name: m.template.componentName,
      component_type: m.template.componentType,
      max_marks: m.maxMarks ?? m.template.defaultWeightage,
      sequence: m.sequence,
      marks_entered: marksMap.has(m.id)
    }));
  }
  async getTeacherExamMarks(
    tenant: string,
    examId: number,
    teacherId: number
  ) {
    const {
      ExamExaminer,
      ExamMark,
      ExamComponentMapping,
      ExamComponentTemplate,
      Student,
    } = getTenantModels(tenant);

    // Step 1: Ensure teacher is assigned as examiner
    const isExaminer = await ExamExaminer.findOne({
      where: { exam_id: examId, teacher_id: teacherId, is_active: 1 }
    });

    if (!isExaminer) {
      throw new Error("You are not assigned as examiner for this exam");
    }

    // Step 2: Fetch all marks entered for this exam
    const marks: any = await ExamMark.findAll({
      where: { exam_id: examId },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "student_id", "student_name", "roll_number"]
        },
        {
          model: ExamComponentMapping,
          as: "component_mapping",
          include: [
            {
              model: ExamComponentTemplate,
              as: "template",
              attributes: ["component_name", "component_type", "default_weightage"]
            }
          ]
        }
      ],
      order: [
        [{ model: Student, as: "student" }, "roll_number", "ASC"],
        [{ model: ExamComponentMapping, as: "component_mapping" }, "sequence", "ASC"]
      ]
    });

    // Step 3: Group marks by student
    const grouped: any = {};

    for (const m of marks) {
      const s = m.student;
      const cm = m.component_mapping;
      const t = cm.template;

      if (!grouped[s.id]) {
        grouped[s.id] = {
          student_id: s.student_id,
          roll_number: s.roll_number,
          student_name: s.student_name,
          components: []
        };
      }

      grouped[s.id].components.push({
        mapping_id: cm.id,
        component_name: t.component_name,
        max_marks: cm.max_marks ?? t.default_weightage,
        marks_obtained: m.marks_obtained
      });
    }

    return Object.values(grouped);
  }
  async saveTeacherMarks(
    tenant: string,
    teacherId: number,
    payload: any
  ) {
    const {
      ExamExaminer,
      ExamMarksLockStatus,
      ExamMark,
      ExamComponentMapping
    } = getTenantModels(tenant);

    const { exam_id, student_id, marks } = payload;

    // Step 1: Validate teacher is assigned as examiner
    const isExaminer = await ExamExaminer.findOne({
      where: { exam_id, teacher_id: teacherId, is_active: 1 }
    });

    if (!isExaminer) {
      throw new Error("You are not assigned as examiner for this exam");
    }

    // Step 2: Check if marks are locked
    const lock = await ExamMarksLockStatus.findOne({
      where: { exam_id }
    });

    if (lock && lock.status === "LOCKED") {
      throw new Error("Marks entry is locked for this exam");
    }

    // Step 3: Validate component mappings
    const mappingIds = marks.map((m: any) => m.component_mapping_id);

    const validMappings = await ExamComponentMapping.findAll({
      where: { id: mappingIds, examId: exam_id }
    });

    if (validMappings.length !== mappingIds.length) {
      throw new Error("Invalid component mapping detected");
    }

    // Step 4: Save marks (insert or update)
    for (const m of marks) {
      const existing = await ExamMark.findOne({
        where: {
          exam_id,
          student_id,
          component_mapping_id: m.component_mapping_id
        }
      });

      if (existing) {
        // Update
        await existing.update({
          marks_obtained: m.marks_obtained,
          updated_by: teacherId
        });
      } else {
        // Insert
        await ExamMark.create({
          exam_id,
          student_id,
          component_mapping_id: m.component_mapping_id,
          marks_obtained: m.marks_obtained,
          entered_by: teacherId
        });
      }
    }

    return { message: "Draft marks saved successfully" };
  }
  async submitTeacherMarks(
    tenant: string,
    teacherId: number,
    examId: string
  ) {
    const {
      ExamExaminer,
      ExamMarksLockStatus,
      ExamComponentMapping,
      StudentExamRegistration,
      ExamMark
    } = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    return await sequelize.transaction(async (t) => {

      // 1. Validate teacher
      const isExaminer = await ExamExaminer.findOne({
        where: { exam_id: examId, teacher_id: teacherId, is_active: 1 },
        transaction: t
      });

      if (!isExaminer) {
        throw new Error("You are not assigned as examiner for this exam");
      }

      // 2. Check lock status
      const lock = await ExamMarksLockStatus.findOne({
        where: { exam_id: examId },
        transaction: t
      });

      if (lock?.status === "LOCKED") {
        throw new Error("Marks entry is already locked for this exam");
      }

      if (lock?.status === "SUBMITTED") {
        throw new Error("Marks have already been submitted");
      }

      // 3. Validate marks completeness
      const components = await ExamComponentMapping.findAll({
        where: { examId },
        attributes: ["id"],
        transaction: t
      });

      const componentIds = components.map((c) => c.id);

      const students = await StudentExamRegistration.findAll({
        where: { exam_id:examId },
        attributes: ["student_id"],
        transaction: t
      });

      for (const s of students) {
        const marksCount = await ExamMark.count({
          where: {
            exam_id: examId,
            student_id: s.student_id,
            component_mapping_id: { [Op.in]: componentIds }
          },
          transaction: t
        });

        if (marksCount !== componentIds.length) {
          throw new Error(
            `Marks incomplete for student ${s.student_id}. Please complete all components.`
          );
        }
      }

      // 4. Update lock status → SUBMITTED
      if (lock) {
        await lock.update(
          {
            status: "SUBMITTED",
            locked_by: teacherId,
            locked_at: new Date()
          },
          { transaction: t }
        );
      } else {
        await ExamMarksLockStatus.create(
          {
            exam_id: Number(examId),
            status: "SUBMITTED",
            locked_by: teacherId,
            locked_at: new Date()
          },
          { transaction: t }
        );
      }

      return { message: "Marks submitted successfully" };
    });
  }

}