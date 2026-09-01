import { NextFunction, Response } from "express";
import { ResultService } from "../services/resultService";
import { getUserId } from "./applicationController";

const resultService = new ResultService();

export const studentResultUpload = async (req: any, res: Response, next: NextFunction) => {
    const data = req.body;
    const tenant = req.tenant;
    // console.log(data);
    try {
        let publishedBy = req.user?.user_id || req.user?.id || req.body?.published_by || req.body?.user_id;
        if (!publishedBy && req.user?.email) {
            publishedBy = await getUserId(req.user.email, tenant);
        }

        const result = await resultService.studentResultUpload(data, tenant, publishedBy);

        return res.status(200).json({
            status: 1,
            data: result,
            message: "Student Result update successfully",
        });
    } catch (error) {
        next(error);
    }
};


export const studentResult = async (req: any, res: Response, next: NextFunction) => {
    const tenant = req.tenant;
    try {
        const result = await resultService.studentResult(req.params.id, tenant);
        return res.status(200).json({
            status: 1,
            data: result,
            message: "Fetch Student Result successfully",
        })
    } catch (error) {
        next(error);
    }
}

export const allSubjects = async (req: any, res: Response, next: NextFunction) => {
    const { programId, studentId } = req.params;
    const tenant = req.tenant;
    try {
        const result = await resultService.allStudentSubject(studentId, programId, tenant);
        return res.status(200).json({
            status: 1,
            data: result,
            message: "Fetch All Student Subjects successfully",
        })
    } catch (error) {
        console.log(error);
    }
}