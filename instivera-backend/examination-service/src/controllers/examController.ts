import { QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";
import { ExamService } from "../services/examService";
import { mapExam } from "../utils/mapper";
import { NextFunction } from "express";
import { UtilService } from "../services/utilService";

const examService = new ExamService();
const utilService = new UtilService();

export async function createExam(req, res, next) {
  try {
    const sequelize = getTenantSequelize(req.tenant);
    const user: any = await sequelize.query(
        `SELECT user_id
        FROM users 
        WHERE email = :email LIMIT 1`,
        {
          replacements: { email: req.user.email },
          type: QueryTypes.SELECT
        }
      );
    const payload = {
      ...req.body,
      created_by: user[0].user_id
    };
    const exam = await examService.createExam(payload, req.tenant);
    return res.status(201).json({
      status: 1,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
}
export async function getAllExams(req, res, next) {
  try {
    const exams = await examService.getAllExams(req.tenant, req.query);
    return res.status(200).json({
      status: 1,
      message: "Exams fetched successfully",
      count: exams.length,
      data: exams.map((e: any) => mapExam(e.get())),
    });
  } catch (error) {
    next(error);
  }
}
export async function getExamById(req, res, next) {
  try {
    const exam = await examService.getExamById(req.params.id, req.tenant);
    return res.status(200).json({
      status: 1,
      message: "Exam fetched successfully",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
}
export async function updateExam(req, res, next) {
  try {
    const exam = await examService.updateExam(req.params.id, req.body, req.tenant);
    return res.status(200).json({
      status: 1,
      message: "Exam updated successfully",
      data: mapExam(exam.get()),
    });
  } catch (error) {
    next(error);
  }
}
export async function deleteExam(req, res, next) {
  try {
    const result = await examService.deleteExam(req.params.id, req.tenant);
    return res.status(200).json({
      status: 1,
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export async function getExamSchedulesWithDetails(req, res, next: NextFunction) {
  try {
    const exam_id = Number(req.params.examId);

    const result = await examService.getExamSchedulesWithDetailsService(
      exam_id,
      req.tenant
    );

    res.status(200).json({
      success: 1,
      message: "Exam schedules with exam details fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
export async function getTeacherExams(req, res, next: NextFunction) {
  try {
    const teacherId = await utilService.getFacultyIdFromUser(req.user, req.tenant);
    const data = await examService.getTeacherExams(req.tenant, teacherId);
    return res.status(200).json({
      status: 1,
      message: "Exams fetched successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
export async function getTeacherExamStudents(req, res, next: NextFunction) {
  try {
    const examId = Number(req.params.examId);
    const teacherId = await utilService.getFacultyIdFromUser(req.user, req.tenant);

    const data = await examService.getTeacherExamStudents(
      req.tenant,
      examId,
      teacherId
    );
    return res.status(200).json({
      status: 1,
      message: "Students fetched successfully",
      data: data,
    });
  } catch (error: any) {
    next(error);
  }
};
export const getAdminExamSummary = async (req, res, next:NextFunction) => {
  try {
    const tenant = req.tenant;
    const examId = req.params.examId;

    const data = await examService.adminExamSummary(tenant, examId);

    return res.status(200).json({
      status: 1,
      message: "Summary fetched successfully",
      data: data,
    });
  } catch (error) {
     next(error);
  }
};