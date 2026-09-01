import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { TeacherService } from "../services/teacherService";

const teacherService = new TeacherService();

export const getTeacherClasses = async (req, res, next: NextFunction) => {
  try {
    const username = (req as any).user?.username;
    if (!username) throw new AppError("Username not found in request", 401);

    const data = await teacherService.getTeacherClasses(username, req.tenant);

    res.status(200).json({
      status: 1,
      data,
      message: "Teacher classes fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllClasses = async (req, res, next: NextFunction) => {
  try {
    const data = await teacherService.getAllClasses(req.tenant);

    res.status(200).json({
      status: 1,
      data,
      message: "Classes fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherPrgrams = async (req, res, next: NextFunction) => {
  try {
    const username = (req as any).user?.username;
    if (!username) throw new AppError("Username not found in request", 401);

    const data = await teacherService.getTeacherPrograms(username, req.tenant);

    res.status(200).json({
      status: 1,
      data,
      message: "Teacher programs fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherAcademicYears = async (req, res, next: NextFunction) => {
  try {
    const username = (req as any).user?.username;
    if (!username) throw new AppError("Username not found in request", 401);

    const data = await teacherService.getTeacherAcademicYears(username, req.tenant);

    res.status(200).json({
      status: 1,
      data,
      message: "Teacher academic years fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
