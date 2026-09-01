import { Request, Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import path from "path";
import fs from "fs";

import * as learningMaterialService from "../services/learningMaterialService";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

/**
 * Standard Success Response
 */
const sendSuccess = (res: Response, message: string, data: any = null, status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};

/**
 * Standard Error Response
 */
const sendError = (res: Response, message: string, status = 500) => {
    return res.status(status).json({
        success: false,
        message,
    });
};

const authorizeMaterialOwnership = async (tenant: string, user: any, materialId: number) => {
    const isAdmin = String(user?.role || "").toLowerCase() === "admin";
    if (isAdmin) {
        return { allowed: true };
    }

    const { getTenantSequelize } = require("../server");
    const sequelize = getTenantSequelize(tenant);

    const [dbUser]: any = await sequelize.query(
        `SELECT user_id FROM users WHERE username = :username OR email = :email LIMIT 1`,
        {
            replacements: {
                username: user?.username,
                email: user?.email,
            },
            type: QueryTypes.SELECT,
        }
    );

    if (!dbUser) {
        return { allowed: false, reason: "User not found", status: 404 };
    }

    const [material]: any = await sequelize.query(
        `SELECT uploaded_by FROM learning_materials WHERE id = :id LIMIT 1`,
        {
            replacements: { id: materialId },
            type: QueryTypes.SELECT,
        }
    );

    if (!material) {
        return { allowed: false, reason: "Learning material not found", status: 404 };
    }

    if (material.uploaded_by !== dbUser.user_id) {
        return {
            allowed: false,
            reason: "You can only edit or delete materials you uploaded",
            status: 403,
        };
    }

    return { allowed: true };
};

/**
 * Create Learning Material (Admin/Teacher)
 */
/**
 * Create Learning Material (Admin/Teacher)
 */
export const createLearningMaterial = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    let uploadedFilePath: string | null = null;

    try {

        const tenant = (req as any).tenant;
        const user = (req as any).user;
        const file = req.file;

        if (!file) {
            return sendError(res, "File is required", 400);
        }

        uploadedFilePath = file.path;

        if (!req.body.title) {
            return sendError(res, "Title is required", 400);
        }

        if (!req.body.subject_id) {
            return sendError(res, "Subject is required", 400);
        }

        const sequelize = getTenantSequelize(tenant);

        const [dbUser]: any = await sequelize.query(
            `
            SELECT user_id
            FROM users
            WHERE username = :username
               OR email = :email
            LIMIT 1
            `,
            {
                replacements: {
                    username: user.username,
                    email: user.email,
                },
                type: QueryTypes.SELECT,
            }
        );

        if (!dbUser) {
            return sendError(res, "Authenticated user not found", 404);
        }

        const insertQuery = `
            INSERT INTO learning_materials (
                title,
                description,
                department_id,
                program_id,
                academic_year_id,
                class_id,
                semester_id,
                subject_id,
                material_type,
                file_name,
                file_path,
                file_size,
                mime_type,
                uploaded_by,
                is_active,
                created_at,
                updated_at
            )
            VALUES (
                :title,
                :description,
                :department_id,
                :program_id,
                :academic_year_id,
                :class_id,
                :semester_id,
                :subject_id,
                :material_type,
                :file_name,
                :file_path,
                :file_size,
                :mime_type,
                :uploaded_by,
                1,
                NOW(),
                NOW()
            )
        `;

        const [result]: any = await sequelize.query(insertQuery, {
            replacements: {
                title: req.body.title,
                description: req.body.description || null,

                department_id: Number(req.body.department_id) || null,
                program_id: Number(req.body.program_id) || null,
                academic_year_id: Number(req.body.academic_year_id) || null,
                class_id: Number(req.body.class_id) || null,
                semester_id: Number(req.body.semester_id) || null,
                subject_id: Number(req.body.subject_id),

                material_type: req.body.material_type || "document",

                file_name: file.originalname,
                file_path: file.path,
                file_size: file.size,
                mime_type: file.mimetype,

                uploaded_by: dbUser.user_id,
            },
            type: QueryTypes.INSERT,
        });

        // Trigger notifications for students who have this subject or belong to the target class
        try {
            const subjectId = Number(req.body.subject_id);

            const [subjectRow]: any = await sequelize.query(
                `SELECT name FROM subjects WHERE id = :subjectId LIMIT 1`,
                {
                    replacements: { subjectId },
                    type: QueryTypes.SELECT,
                }
            );

            const subjectName = subjectRow?.name || "your course";
            const notifTitle = "New Learning Material";
            const notifMessage = `New learning material "${req.body.title}" has been added for ${subjectName}.`;

            let targetStudents: any = await sequelize.query(
                `SELECT DISTINCT 
                   COALESCE(s.user_id, sp.user_id, u.user_id) AS user_id, 
                   s.id AS student_id
                 FROM students s
                 LEFT JOIN student_personal_details sp ON sp.student_id = s.id
                 LEFT JOIN users u ON (u.user_id = s.user_id OR u.user_id = sp.user_id OR u.email COLLATE utf8mb4_general_ci = s.email COLLATE utf8mb4_general_ci)
                 LEFT JOIN student_subjects ss ON ss.student_id = s.id
                 WHERE (ss.subject_id = :subjectId OR :subjectId IS NULL)
                   AND COALESCE(s.user_id, sp.user_id, u.user_id) IS NOT NULL`,
                {
                    replacements: { subjectId },
                    type: QueryTypes.SELECT,
                }
            );

            if (!targetStudents || targetStudents.length === 0) {
                targetStudents = await sequelize.query(
                    `SELECT DISTINCT 
                       COALESCE(s.user_id, sp.user_id, u.user_id) AS user_id, 
                       s.id AS student_id
                     FROM students s
                     LEFT JOIN student_personal_details sp ON sp.student_id = s.id
                     LEFT JOIN users u ON (u.user_id = s.user_id OR u.user_id = sp.user_id OR LOWER(u.role) = 'student')
                     WHERE COALESCE(s.user_id, sp.user_id, u.user_id) IS NOT NULL`,
                    { type: QueryTypes.SELECT }
                );
            }

            if (!targetStudents || targetStudents.length === 0) {
                targetStudents = await sequelize.query(
                    `SELECT user_id, NULL AS student_id FROM users WHERE LOWER(role) = 'student'`,
                    { type: QueryTypes.SELECT }
                );
            }

            if (targetStudents && targetStudents.length > 0) {
                for (const st of targetStudents) {
                    if (!st.user_id) continue;
                    await sequelize.query(
                        `INSERT INTO notifications (user_id, student_id, channel, to_address, title, message, type, link, is_read, status, created_at)
                         VALUES (:userId, :studentId, 'IN_APP', NULL, :title, :message, 'info', :link, 0, 'SENT', NOW())`,
                        {
                            replacements: {
                                userId: st.user_id,
                                studentId: st.student_id || null,
                                title: notifTitle,
                                message: notifMessage,
                                link: `/student/learning-material?id=${result}`
                            },
                            type: QueryTypes.INSERT,
                        }
                    );
                }
            }
        } catch (notifErr) {
            console.error("Failed to generate student notifications for learning material:", notifErr);
        }

        return res.status(201).json({
            success: true,
            message: "Learning material uploaded successfully",
            data: {
                materialId: result,
                uploadedFile: {
                    originalName: file.originalname,
                    filename: path.basename(file.path),
                    path: file.path,
                    mimeType: file.mimetype,
                    size: file.size,
                },
            },
        });

    } catch (error) {

        // Cleanup Uploaded File if DB Fails
        if (uploadedFilePath) {
            try {
                if (fs.existsSync(uploadedFilePath)) {
                    fs.unlinkSync(uploadedFilePath);
                }
            } catch (cleanupError) {
                console.error(
                    "Failed to cleanup uploaded learning material:",
                    cleanupError
                );
            }
        }

        next(error);
    }
};
/**
 * Get All Learning Materials (Admin/Teacher)
 */
export const getLearningMaterials = async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant;
        const filters = {
            department_id: req.query.department_id ? Number(req.query.department_id) : undefined,
            program_id: req.query.program_id ? Number(req.query.program_id) : undefined,
            academic_year_id: req.query.academic_year_id ? Number(req.query.academic_year_id) : undefined,
            class_id: req.query.class_id ? Number(req.query.class_id) : undefined,
            semester_id: req.query.semester_id ? Number(req.query.semester_id) : undefined,
            subject_id: req.query.subject_id ? Number(req.query.subject_id) : undefined,
        };

        const result = await learningMaterialService.getAll(tenant, filters);
        return sendSuccess(res, "Learning materials fetched successfully", result);
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

/**
 * Get Student Specific Learning Materials
 */
export const getMyLearningMaterials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;

        // Get user_id from DB (JWT only has username/email)
        const { QueryTypes } = require("sequelize");
        const { getTenantSequelize } = require("../server");
        const sequelize = getTenantSequelize(tenant);

        const [dbUser] = await sequelize.query(
            `SELECT user_id FROM users WHERE username = :username OR email = :email LIMIT 1`,
            { replacements: { username: user.username, email: user.email }, type: QueryTypes.SELECT }
        );

        if (!dbUser) {
            return sendError(res, "User not found", 404);
        }

        // Find student record by user_id
        const [student] = await sequelize.query(
            `SELECT id FROM students WHERE user_id = :userId LIMIT 1`,
            { replacements: { userId: dbUser.user_id }, type: QueryTypes.SELECT }
        );

        if (!student) {
            return sendError(res, "Student profile not found", 404);
        }

        const result = await learningMaterialService.getStudentMaterials(tenant, student.id);
        return sendSuccess(res, "Your learning materials fetched successfully", result);
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

/**
 * Get By ID
 */
export const getLearningMaterialById = async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;
        const result = await learningMaterialService.getById(tenant, Number(req.params.id));

        if (!result) {
            return sendError(res, "Learning material not found", 404);
        }

        // Student Authorization check for individual file access
        if (user.role === "student") {
            const { Student } = getTenantModels(tenant);
            const student = await Student.findOne({ where: { user_id: user.id } });

            if (!student ||
                result.department_id !== (student as any).department_id ||
                result.class_id !== (student as any).class_id ||
                result.semester_id !== (student as any).semester_id) {
                return sendError(res, "Unauthorized access to this material", 403);
            }
        }

        return sendSuccess(res, "Learning material fetched successfully", result);
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

/**
 * Update (Admin/Teacher)
 */
export const updateLearningMaterial = async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;
        const payload = { ...req.body };

        const auth = await authorizeMaterialOwnership(tenant, user, Number(req.params.id));
        if (!auth.allowed) {
            return sendError(res, auth.reason || "Unauthorized", auth.status || 403);
        }

        // If a new file was uploaded, add file fields to payload
        if (req.file) {
            payload.file_name = req.file.originalname;
            payload.file_path = req.file.path;
            payload.file_size = req.file.size;
            payload.mime_type = req.file.mimetype;
        }

        const result = await learningMaterialService.update(tenant, Number(req.params.id), payload);

        // Clean up old file if a new one was uploaded
        if (req.file && result.oldFilePath) {
            const path = require("path");
            const fs = require("fs");
            const oldPath = path.resolve(result.oldFilePath);
            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch (e) { console.error("Old file cleanup failed:", e); }
            }
        }

        return sendSuccess(res, "Learning material updated successfully", result);
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

/**
 * Delete (Permanent Delete)
 */
export const deleteLearningMaterial = async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;

        const auth = await authorizeMaterialOwnership(tenant, user, Number(req.params.id));
        if (!auth.allowed) {
            return sendError(res, auth.reason || "Unauthorized", auth.status || 403);
        }

        await learningMaterialService.permanentDelete(tenant, Number(req.params.id));

        return sendSuccess(res, "Learning material deleted successfully");
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

/**
 * Download Learning Material File
 */
export const downloadLearningMaterial = async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant;
        const { QueryTypes } = require("sequelize");
        const { getTenantSequelize } = require("../server");
        const sequelize = getTenantSequelize(tenant);

        const [material] = await sequelize.query(
            `SELECT file_name, file_path, mime_type FROM learning_materials WHERE id = :id AND is_active = 1 LIMIT 1`,
            { replacements: { id: Number(req.params.id) }, type: QueryTypes.SELECT }
        );

        if (!material) {
            return sendError(res, "Learning material not found", 404);
        }

        const path = require("path");
        const fs = require("fs");
        const absolutePath = path.resolve(material.file_path);

        if (!fs.existsSync(absolutePath)) {
            return sendError(res, "File not found on server", 404);
        }

        res.setHeader("Content-Disposition", `attachment; filename="${material.file_name}"`);
        res.setHeader("Content-Type", material.mime_type || "application/octet-stream");

        return res.sendFile(absolutePath);
    } catch (error: any) {
        return sendError(res, error.message);
    }
};
