import { NextFunction } from "express";
import { ExamComponentService } from "../services/examComponentService";
import { AppError } from "../utils/appError";
import { UtilService } from "../services/utilService";

const examComponentService = new ExamComponentService();
const utilService = new UtilService();

export async function getAllTemplates(req, res, next) {
  try {
    const templates = await examComponentService.getAllTemplates(req.tenant);
    return res.status(200).json({
      status: 1,
      message: "Exam templates fetched successfully",
      count: templates.length,
      data: templates.map((c: any) => c.get()),
    });
  } catch (error) {
    next(error);
  }
}

export async function createComponentTemplate(req, res, next) {
  try {
    const component = await examComponentService.createComponentTemplate(req.body, req.tenant);
    return res.status(201).json({
      status: 1,
      message: "Exam component created successfully",
      data: component.get(),
    });
  } catch (error) {
    next(error);
  }
}
export async function getComponentsByExam(req, res, next) {
  try {
    const components = await examComponentService.getComponentsByExamId(
      req.params.examId,
      req.tenant
    );
    return res.status(200).json({
      status: 1,
      message: "Exam components fetched successfully",
      count: components.length,
      data: components,
    });
  } catch (error) {
    next(error);
  }
}
export async function getComponentTemplateById(req, res, next) {
  try {
    const component = await examComponentService.getComponentTemplateById(
      req.params.templateId,
      req.tenant
    );
    return res.status(200).json({
      status: 1,
      message: "Exam component fetched successfully",
      data: component.get(),
    });
  } catch (error) {
    next(error);
  }
}
export async function updateComponentTemplate(req, res, next) {
  try {
    const component = await examComponentService.updateComponentTemplate(
      req.params.templateId,
      req.body,
      req.tenant
    );
    return res.status(200).json({
      status: 1,
      message: "Exam component updated successfully",
      data: component.get(),
    });
  } catch (error) {
    next(error);
  }
}
export async function deleteComponentTemplate(req, res, next) {
  try {
    const result = await examComponentService.deleteComponentTemplate(
      req.params.templateId,
      req.tenant
    );
    return res.status(200).json({
      status: 1,
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
export async function reorderComponents(req, res, next) {
  try {
    const { templateIds } = req.body;
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      throw new AppError("component_ids must be a non-empty array", 400);
    }

    const result = await examComponentService.reorderComponents(
      req.params.examId,
      templateIds,
      req.tenant
    );
    return res.status(200).json({
      status: 1,
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
export const addComponentToExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const tenant = req.tenant; // from middleware
    const data = req.body;

    const result = await examComponentService.addComponentToExam(
      examId,
      data,
      tenant
    );

    return res.status(201).json({
      status: 1,
      message: "Component added to exam successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
export const updateComponentMapping = async (req, res, next) => {
  try {
    const { mappingId } = req.params;
    const tenant = req.tenant;
    const data = req.body;

    const updated = await examComponentService.updateComponentMapping(
      mappingId,
      data,
      tenant
    );

    return res.status(200).json({
      success: 1,
      message: "Component mapping updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteComponentMapping = async (req, res, next) => {
  try {
    const { examId, templateId } = req.params;
    const tenant = req.tenant;

    const result = await examComponentService.deleteComponentMapping(
      examId,
      templateId,
      tenant
    );

    return res.status(200).json({
      status: 1,
      message: "Component mapping deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
export async function getTeacherExamComponents(req, res, next: NextFunction) {
  try {
    const examId = Number(req.params.examId);
    const teacherId = await utilService.getFacultyIdFromUser(req.user, req.tenant);

    const data = await examComponentService.getTeacherExamComponents(
      req.tenant,
      examId,
      teacherId
    );

    return res.status(200).json({
      status: 1,
      message: "Component mapping fetched successfully",
      data: data,
    });
  } catch (error: any) {
    next(error);
  }
};
export async function getTeacherExamMarks(req, res, next: NextFunction) {
  try {
    const examId = Number(req.params.examId);
    const teacherId = await utilService.getFacultyIdFromUser(req.user, req.tenant);

    const data = await examComponentService.getTeacherExamMarks(
      req.tenant,
      examId,
      teacherId
    );
    return res.status(200).json({
      status: 1,
      message: "Exam marks fetched successfully",
      data: data,
    });
  } catch (error: any) {
    next(error);
  }
};
export async function saveTeacherMarks(req, res, next: NextFunction) {
  try {
    const teacherId = await utilService.getFacultyIdFromUser(req.user, req.tenant);

    const result = await examComponentService.saveTeacherMarks(
      req.tenant,
      teacherId,
      req.body
    );
    return res.status(200).json({
      status: 1,
      message: "Exam marks saved successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};
export async function submitTeacherMarks(req, res, next: NextFunction) {
  try {
    const examId = req.params.examId;
    const teacherId = await utilService.getFacultyIdFromUser(req.user, req.tenant);
    const result = await examComponentService.submitTeacherMarks(
      req.tenant,
      teacherId,
      examId
    );
    return res.status(200).json({
      status: 1,
      message: "Exam marks submitted successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};