import { NextFunction } from "express";
import { ExamResultService } from "../services/examResultService";
import { UtilService } from "../services/utilService";

const examResultService = new ExamResultService();
const utilService = new UtilService();

export async function calculateExamResults(req, res, next) {
  try {
    const userId = await utilService.getUserId(req.user, req.tenant);
    const result = await examResultService.calculateExamResults(req.tenant, userId, req.params.examId);
    return res.status(200).json({
      status: 1,
      message: "Exam reult calculated successfully",
      data:result,
    });
  } catch (error) {
    next(error);
  }
}

export async function finaliseExamResults(req, res, next) {
  try {
    const userId = await utilService.getUserId(req.user, req.tenant);
    const result = await examResultService.finaliseExamResults(req.tenant, userId, req.params.examId);
    return res.status(200).json({
      status: 1,
      message: "Exam finalised successfully",
      data:result,
    });
  } catch (error) {
    next(error);
  }
}
export async function publishExamResults(req, res, next) {
  try {
    const userId = await utilService.getUserId(req.user, req.tenant);
    const result = await examResultService.publishExamResults(req.tenant, userId, req.params.examId);
    return res.status(200).json({
      status: 1,
      message: "Exam published successfully",
      data:result,
    });
  } catch (error) {
    next(error);
  }
};
export const getExamResults = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const examId = req.params.examId;
    const data = await examResultService.getExamResults(tenant, examId);

    return res.status(200).json({
      status: 1,
      message: "Exam published successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
export const getStudentResults = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const studentId = await utilService.getStudentIdFromUser(req.user, req.tenant);
    const data = await examResultService.getStudentResults(tenant, studentId);

    return res.status(200).json({
      status: 1,
      message: "Exam results fetched successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
export const getStudentResultDetails = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const studentId = await utilService.getStudentIdFromUser(req.user, req.tenant);
    const examId = req.params.examId;

    const data = await examResultService.getStudentResultDetails(tenant, studentId, examId);

    return res.status(200).json({
      status: 1,
      message: "Exam result fetched successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

