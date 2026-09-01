import { NextFunction, Request, Response } from "express";
import fs from "fs";
import { StudentAdmissionService } from "../services/studentAdmissionService";
import { BulkUploadService } from "../services/bulkUploadService";

const service = new StudentAdmissionService();
const bulkStudentService = new BulkUploadService()
/**
 * POST /api/admission/student-admission/upload
 * Upload a single Excel file and dynamically store data in student_admission table.
 */



export const allStudentUpdate = async (req: any, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const tenant = req.tenant; // Assuming tenant is populated on the request object by middleware        
        const result = await bulkStudentService.processBulkJson(data, tenant);
        
        if (result.successful === 0 && result.failed > 0) {
            return res.status(400).json({
                status: 0,
                data: result,
                message: `Failed to update student data. First error: ${result.errors[0]?.message}`
            });
        }
        
        return res.status(200).json({
            status: 1,
            data: result,
            message: "All Student update successfully"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

/**
 * POST /api/admission/student-admission/preview
 * Preview the Excel columns and first 5 rows without saving to DB.
 */

