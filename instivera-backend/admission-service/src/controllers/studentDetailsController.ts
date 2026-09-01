import { NextFunction, Response } from "express";
import { StudentDetailsService } from "../services/studentDetailsService";
import { getTenantSequelize } from "../server";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { getUserId } from "./applicationController";

const studentDetailsService = new StudentDetailsService();

export const getStudentDetails = async (req, res: Response, next: NextFunction) => {
    const userId = await getUserId(req.user.email, req.tenant);
    try {
        const { classId, academicYearId, status, searchText, page, limit } = req.query;
        // console.log("--------------->", classId, academicYearId, status, searchText, page, limit)

        const result = await studentDetailsService.studentApplication(
            userId, classId, academicYearId, status, searchText, page, limit,
            req.tenant
        );

        return res.status(200).json({
            status: 1,
            data: result,   // result is { registrations: [...], pagination: { page, limit, total, totalPages } }
            message: "Registration details fetched successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const getStudentById = async (req, res: Response, next: NextFunction) => {
    try {
        const { studentId } = req.params;
        // console.log("studentId", studentId);
        const result = await studentDetailsService.getStudentById(studentId, req.tenant);
        return res.status(200).json({
            status: 1,
            data: result,
            message: "Student details fetched successfully",
        });
    } catch (error) {
        next(error);
    }
}

export const bulkUpdateRegistrationStatus = async (req, res: Response, next: NextFunction) => {
    const { registrationIds, status, remarks } = req.body;
    // console.log("registrationIds", registrationIds);
    try {

        if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
            throw new AppError(
                "registrationIds must be a non-empty array.",
                400
            );
        }

        if (!status) {
            throw new AppError("status is required", 400);
        }
        const result = await studentDetailsService.bulkUpdateRegistrationStatus(
            registrationIds,
            status,
            remarks,
            req.tenant
        );
        return res.status(200).json({
            status: 1,
            data: result,
            message:
                status === "SELECTED"
                    ? `${result.success} student(s) selected. Payment links sent successfully.`
                    : `${result.success} registration(s) updated successfully.`,
        });

    } catch (error) {

    }
}

// GET SEMESTER
export const semesters = async (req, res, next: NextFunction) => {
    const { classId, programId } = req.params;
    try {
        const result = await studentDetailsService.semestersService(classId, programId, req.tenant);
        res.status(200).json({
            status: 1,
            data: result,
            message: "Semester details fetched successfully",
        })
    } catch (error: any) {
        throw error;
    }
}

// CREATE STUDENT
export const createStudent = async (req, res, next: NextFunction) => {
    const studentData = req.body;
    const adminId = await getUserId(req.user.email, req.tenant);
    try {
        const result = await studentDetailsService.submitStudentData(adminId, studentData, req.tenant);
        return res.status(200).json({
            status: 1,
            data: result,
            message: "Student data created successfully",
        })
    } catch (error) {
        next(error);
    }
}

// GET ALL STUDENT

export const getAllStudent = async (req, res, next: NextFunction) => {
    const { roll_number, student_name, email } = req.query as {
        roll_number?: string;
        student_name?: string;
        email?: string;
    };
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const result = await studentDetailsService.getAllStudent(req.tenant, roll_number, student_name, email, page, limit);
        return res.status(200).json({
            status: 1,
            data: result,
            message: "All student data fetch successfully"
        });
    } catch (error) {
        next(error);
    }
}

export const getAllStudentReports = async (req, res, next: NextFunction) => {
    const { roll_number, student_name, email } = req.query as {
        roll_number?: string;
        student_name?: string;
        email?: string;
    };
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const result = await studentDetailsService.getAllStudentReports(req.tenant, roll_number, student_name, email, page, limit);
        return res.status(200).json({
            status: 1,
            data: result,
            message: "All student report data fetched successfully"
        });
    } catch (error) {
        next(error);
    }
}

export const updateStudent = async (req, res, next: NextFunction) => {
    const { userId } = req.params;
    const studentData = req.body;
    try {
        const result = await studentDetailsService.updateStudent(req.tenant, userId, studentData);
        return res.status(200).json({
            status: 1,
            data: result,
            message: "Student data updated successfully",
        })
    } catch (error) {
        next(error);
    }

}
