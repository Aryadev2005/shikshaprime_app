import { NextFunction } from "express";
import { ExaminerService } from "../services/examinerService";
import { getTenantSequelize } from "../server";
import { QueryTypes } from "sequelize";
import { UtilService } from "../services/utilService";

const examinerService = new ExaminerService();
const utilService = new UtilService();

export async function getEligibleExaminers(req, res, next:NextFunction) {
  try {
    const examId = Number(req.params.examId);

    const data = await examinerService.getEligibleExaminers(req.tenant, examId);

    return res.status(200).json({
      status: 1,
      message: "Exam fetched successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
}
export async function assignExaminer(req, res, next: NextFunction) {
  try {
    const examId = Number(req.params.examId);
    const sequelize = getTenantSequelize(req.tenant);
    console.log(req.user);
    const user: any = await sequelize.query(
        `SELECT user_id
        FROM users 
        WHERE email = :email LIMIT 1`,
        {
          replacements: { email: req.user.email },
          type: QueryTypes.SELECT
        }
      );
      console.log(user);

    const payload = req.body;

    const result = await examinerService.assignExaminer(req.tenant, examId, user[0].user_id, payload);

    return res.status(201).json({
      status: 1,
      message: "Examiner assigned successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
}
export async function getAssignedExaminers(req, res, next: NextFunction) {
  try {
    const examId = Number(req.params.examId);
    const data = await examinerService.getAssignedExaminers(req.tenant, examId);
    return res.status(200).json({
      status: 1,
      message: "Examiners fetched successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
}
export async function getTeacherExamSummary(req, res, next: NextFunction) {
  try {
    const examId = Number(req.params.examId);
    const teacherId = await utilService.getFacultyIdFromUser(req.user, req.tenant);

    const data = await examinerService.getTeacherExamSummary(
      req.tenant,
      examId,
      teacherId
    );
    return res.status(200).json({
      status: 1,
      message: "Summary fetched successfully",
      data: data,
    });
  } catch (error: any) {
    next(error);
  }
};