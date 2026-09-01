import { NextFunction } from "express";
import { ExamScheduleService } from "../services/examScheduleService";

const examScheduleService = new ExamScheduleService();

export async function createExamSchedule(req, res, next: NextFunction) {
  try {
    const schedule = await examScheduleService.createExamSchedule(req.body, req.tenant);
    res.status(201).json({
      success: 1,
      message: "Exam scheduled successfully",
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

export async function getExamSchedules(req, res, next: NextFunction) {
  try {
    const exam_id = req.params.examId;
    const schedules = await examScheduleService.getExamSchedules(Number(exam_id), req.tenant);

    res.status(200).json({
      success: 1,
      message: "Exam schedules fetched successfully",
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

export async function updateExamSchedule(req, res, next: NextFunction) {
  try {
    const schedule = await examScheduleService.updateExamSchedule(req.body, req.tenant);

    res.status(200).json({
      success: 1,
      message: "Exam schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};
export async function deleteExamSchedule(req, res, next: NextFunction) {
  try {
    const { id } = req.params;

    const result = await examScheduleService.deleteExamSchedule(Number(id), req.tenant);

    res.status(200).json({
      success: 1,
      message: "Exam schedule deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
export async function checkRoomAvailability(req, res, next: NextFunction) {
  try {
    const result = await examScheduleService.checkRoomAvailability(req.body, req.tenant);

    res.status(200).json({
      success: 1,
      message: result.available
        ? "Room is available"
        : "Room is NOT available",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
export async function getAllExamSchedules(req, res, next: NextFunction) {
  try {
    const data = await examScheduleService.getAllExamSchedules(req.tenant);

    res.status(200).json({
      success: 1,
      message: "All exam schedules fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
export async function getUpcomingExamSchedules(req, res, next: NextFunction) {
  try {
    const schedules = await examScheduleService.getUpcomingExamSchedules(req.tenant);

    res.status(200).json({
      success: 1,
      message: "Upcoming exam schedules fetched successfully",
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
}
