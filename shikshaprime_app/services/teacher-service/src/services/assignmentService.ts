import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { getTenantSequelize } from "../server";
import { getTenantModels } from "../models";

interface FileAttachment {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
}

interface TeacherAssignmentCreationData {
    faculty_id: number;
    title: string;
    description?: string;
    detailed_instructions?: string;
    type: 'Assignment' | 'Homework';
    subject_id: number;
    program_id: number;
    class_id: number;
    semester_id: number;
    section_id?: number;
    academic_year_id: number;
    due_date: string;
    due_time: string;
    maximum_marks?: number;
    allow_late_submissions?: boolean;
    send_notification?: boolean;    
}

interface TeacherAssignment {
    id: number;
    teacher_id: number;
    program_id: number;
    semester_id: number;
    section_id: number;
    academic_year_id: number;
    class_id: number;
    is_active: boolean;
    created_at: Date;
    title?: string;
    description?: string;
    detailed_instructions?: string;
    type?: 'Assignment' | 'Homework';
    subject_id?: number;
    due_date?: string;
    due_time?: string;
    maximum_marks?: number;
    allow_late_submissions?: boolean;
    send_notification?: boolean;
    updated_at?: Date;
}

export class AssignmentService {
    private calculateGrade(marks: number): string {
        if (marks >= 90) return 'A+';
        if (marks >= 80) return 'A';
        if (marks >= 70) return 'B';
        if (marks >= 60) return 'C';
        if (marks >= 50) return 'D';
        return 'E';
    }

    
    /**
     * Create a new assignment by inserting into existing teacher_assignments table
     */
    async createAssignment(assignmentData: TeacherAssignmentCreationData, tenant:string): Promise<Number> {
        try {
            const query = `
                INSERT INTO teacher_assignments (
                    teacher_id, program_id, class_id, semester_id, section_id, academic_year_id,
                    title, description, detailed_instructions, type, subject_id, due_date, due_time,
                    maximum_marks, allow_late_submissions, send_notification, is_active
                ) VALUES (
                    :teacher_id, :program_id, :class_id, :semester_id, :section_id, :academic_year_id,
                    :title, :description, :detailed_instructions, :type, :subject_id, :due_date, :due_time,
                    :maximum_marks, :allow_late_submissions, :send_notification, 1
                )
            `;
            const sequelize = getTenantSequelize(tenant);
            const [result] = await sequelize.query(query, {
                replacements: {
                    teacher_id: assignmentData.faculty_id,
                    program_id: assignmentData.program_id || 1,
                    class_id: assignmentData.class_id || 1,
                    semester_id: assignmentData.semester_id || 1,
                    section_id: assignmentData.section_id || null,
                    academic_year_id: assignmentData.academic_year_id || 1,
                    title: assignmentData.title,
                    description: assignmentData.description,
                    detailed_instructions: assignmentData.detailed_instructions,
                    type: assignmentData.type,
                    subject_id: assignmentData.subject_id,
                    due_date: assignmentData.due_date,
                    due_time: assignmentData.due_time,
                    maximum_marks: assignmentData.maximum_marks || 100,
                    allow_late_submissions: assignmentData.allow_late_submissions ? 1 : 0,
                    send_notification: assignmentData.send_notification ? 1 : 0
                },
                type: QueryTypes.INSERT
            });            
            return result;
        } catch (error) {
            console.error("Error creating assignment:", error);
            throw new AppError("Failed to create assignment", 500);
        }
    }

    /**
     * Get all assignments for a faculty member from teacher_assignments table
     */
    async getFacultyAssignments(
        facultyId: number,
        filters: {
            type?: 'Assignment' | 'Homework';
            subject_id?: number;
            program_id?: number;
            section_id?: number;
            status?: 'active' | 'inactive' | 'all';
            page?: number;
            limit?: number;
        } = {},
        tenant: string
    ): Promise<{ assignments: TeacherAssignment[]; total: number; page: number; limit: number }> {
        try {
            const {
                type,
                subject_id,
                program_id,
                section_id,
                status = 'active',
                page = 1,
                limit = 20
            } = filters;

            const offset = (page - 1) * limit;
            let whereConditions = [`fa.teacher_id = ${facultyId}`];
            let havingConditions = ['fa.title IS NOT NULL']; // Only assignments with titles

            if (type) whereConditions.push(`fa.type = '${type}'`);
            if (subject_id) whereConditions.push(`fa.subject_id = ${subject_id}`);
            if (program_id) whereConditions.push(`fa.program_id = ${program_id}`);
            if (section_id) whereConditions.push(`fa.section_id = ${section_id}`);
            if (status !== 'all') whereConditions.push(`fa.is_active = ${status === 'active' ? 1 : 0}`);

            const whereClause = whereConditions.join(' AND ');
            const havingClause = havingConditions.join(' AND ');

            // Query to get assignments with submission count
            const assignmentsQuery = `
                SELECT 
                    fa.*,
                    s.name as subject_name,
                    p.name as program_name,
                    sec.name as section_name,
                    COALESCE(sub_count.submissions, 0) as submissions, 
                    (fa.allow_late_submissions = 1) AS allow_late_submissions
                FROM teacher_assignments fa
                LEFT JOIN subjects s ON fa.subject_id = s.id
                LEFT JOIN programs p ON fa.program_id = p.id
                LEFT JOIN sections sec ON fa.section_id = sec.id
                LEFT JOIN (
                    SELECT teacher_assignment_id, COUNT(*) as submissions
                    FROM student_assignment_submissions 
                    WHERE status != 'not_submitted'
                    GROUP BY teacher_assignment_id
                ) sub_count ON fa.id = sub_count.teacher_assignment_id
                WHERE ${whereClause}
                HAVING ${havingClause}
                ORDER BY fa.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;

            // Query to get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM teacher_assignments fa
                WHERE ${whereClause} AND fa.title IS NOT NULL
            `;
            const sequelize = getTenantSequelize(tenant);
            const [assignments, countResult] = await Promise.all([
                sequelize.query(assignmentsQuery, { type: QueryTypes.SELECT }),
                sequelize.query(countQuery, { type: QueryTypes.SELECT })
            ]);

            const total = (countResult[0] as any)?.total || 0;

            return {
                assignments: assignments as TeacherAssignment[],
                total,
                page,
                limit
            };
        } catch (error) {
            console.error("Error fetching faculty assignments:", error);
            throw new AppError("Failed to fetch assignments", 500);
        }
    }

    /**
     * Get assignment by ID from teacher_assignments table
     */
    async getAssignmentById(assignmentId: number, facultyId: number, tenant: string): Promise<TeacherAssignment | null> {
        try {
            let whereConditions = [`ta.id = ${assignmentId}`];
            if (facultyId) whereConditions.push(`ta.teacher_id = ${facultyId}`);

            const query = `
                SELECT 
                    ta.*,
                    s.name as subject_name,
                    p.name as program_name,
                    ac.name as academic_year,
                    cl.name as class_name,
                    sec.name as section_name,
                    COALESCE(sub_count.submissions, 0) as submissions, 
                    (ta.allow_late_submissions = 1) AS allow_late_submissions
                FROM teacher_assignments ta
                LEFT JOIN subjects s ON ta.subject_id = s.id
                LEFT JOIN programs p ON ta.program_id = p.id 
                LEFT JOIN academic_years ac ON ta.academic_year_id = ac.id 
                LEFT JOIN classes cl ON ta.class_id = cl.id 
                LEFT JOIN sections sec ON ta.section_id = sec.id
                LEFT JOIN (
                    SELECT teacher_assignment_id, COUNT(*) as submissions
                    FROM student_assignment_submissions 
                    WHERE status != 'not_submitted'
                    GROUP BY teacher_assignment_id
                ) sub_count ON ta.id = sub_count.teacher_assignment_id
                WHERE ${whereConditions.join(' AND ')}
                AND ta.title IS NOT NULL
            `;
            const sequelize = getTenantSequelize(tenant);
            const result = await sequelize.query(query, { type: QueryTypes.SELECT });
            return result.length > 0 ? result[0] as TeacherAssignment : null;
        } catch (error) {
            console.error("Error fetching assignment by ID:", error);
            throw new AppError("Failed to fetch assignment", 500);
        }
    }

    /**
     * Update assignment
     */
    async updateAssignment(
        assignmentId: number, 
        updateData: any,
        facultyId: number,
        tenant: string
    ): Promise<TeacherAssignment | null> {
        try {
            const query = `
                UPDATE teacher_assignments 
                SET title = :title, description = :description, detailed_instructions = :detailed_instructions,
                    type = :type, subject_id = :subject_id, due_date = :due_date, due_time = :due_time,
                    maximum_marks = :maximum_marks, allow_late_submissions = :allow_late_submissions,
                    send_notification = :send_notification
                WHERE id = :assignment_id ${facultyId ? 'AND teacher_id = :faculty_id' : ''}
            `;

            const replacements: any = {
                assignment_id: assignmentId,
                ...updateData
            };

            // Convert boolean values to integers for MySQL compatibility
            if (typeof replacements.allow_late_submissions === 'boolean') {
                replacements.allow_late_submissions = replacements.allow_late_submissions ? 1 : 0;
            }
            if (typeof replacements.send_notification === 'boolean') {
                replacements.send_notification = replacements.send_notification ? 1 : 0;
            }

            if (facultyId) {
                replacements.faculty_id = facultyId;
            }
            const sequelize = getTenantSequelize(tenant);
            await sequelize.query(query, {
                replacements,
                type: QueryTypes.UPDATE
            });

            return this.getAssignmentById(assignmentId, facultyId, tenant);
        } catch (error) {
            console.error("Error updating assignment:", error);
            throw new AppError("Failed to update assignment", 500);
        }
    }

    /**
     * Delete assignment
     */
    async deleteAssignment(assignmentId: number, facultyId: number, tenant: string): Promise<boolean> {
        try {
            const query = `
                DELETE FROM teacher_assignments 
                WHERE id = :assignment_id ${facultyId ? 'AND faculty_id = :faculty_id' : ''}
            `;

            const replacements: any = { assignment_id: assignmentId };
            if (facultyId) {
                replacements.faculty_id = facultyId;
            }
            const sequelize = getTenantSequelize(tenant);
            const result = await sequelize.query(query, {
                replacements,
                type: QueryTypes.DELETE
            });

            return true; // Assume success if no error is thrown
        } catch (error) {
            console.error("Error deleting assignment:", error);
            throw new AppError("Failed to delete assignment", 500);
        }
    }

    /**
     * Create assignment attachments for uploaded files
     */
    async createAssignmentAttachments(assignmentId: number, files: FileAttachment[], tenant: string): Promise<any[]> {
        try {
            const attachments = [];
            const { AssignmentAttachment } = getTenantModels(tenant);
            for (const file of files) {
                const fileUrl = `/api/teacher/assignments/${assignmentId}/files/${file.filename}`;
                
                const attachment = await AssignmentAttachment.create({
                    teacher_assignment_id: assignmentId,
                    file_name: file.originalname,
                    file_url: fileUrl,
                    file_size: file.size,
                    file_type: file.mimetype
                });
                
                attachments.push(attachment);
            }
            
            return attachments;
        } catch (error) {
            console.error("Error creating assignment attachments:", error);
            throw new AppError("Failed to save file attachments", 500);
        }
    }

    /**
     * Get assignment attachments by assignment ID
     */
    async getAssignmentAttachments(assignmentId: number, tenant: string): Promise<any[]> {
        try {
            const { AssignmentAttachment } = getTenantModels(tenant);
            return await AssignmentAttachment.findAll({
                where: {
                    teacher_assignment_id: assignmentId
                },
                order: [['uploaded_at', 'DESC']]
            });
        } catch (error) {
            console.error("Error fetching assignment attachments:", error);
            throw new AppError("Failed to fetch attachments", 500);
        }
    }

    /**
     * Delete assignment attachment
     */
    async deleteAssignmentAttachment(attachmentId: number, assignmentId: number, tenant:string): Promise<boolean> {
        try {
            const { AssignmentAttachment } = getTenantModels(tenant);
            const whereConditions: any = { id: attachmentId };
            if (assignmentId) {
                whereConditions.teacher_assignment_id = assignmentId;
            }

            const result = await AssignmentAttachment.destroy({
                where: whereConditions
            });

            return result > 0;
        } catch (error) {
            console.error("Error deleting assignment attachment:", error);
            throw new AppError("Failed to delete attachment", 500);
        }
    }

    async getSubmittedAssignments(
        facultyId: number,
        filters: {
            department_id?: number | string;
            program_id?: number | string;
            class_id?: number | string;
            section_id?: number | string;
            roll_number?: string;
            student_id?: string;
            student_name?: string;
            page?: number;
            limit?: number;
        } = {}, tenant: string
    ): Promise<{ assignments: any[]; total: number; page: number; limit: number }> {
        try {
            const {
                department_id,
                program_id,
                class_id,
                section_id,
                roll_number,
                student_id,
                student_name,
                page = 1,
                limit = 10,
            } = filters;

            const offset = (page - 1) * limit;

            const whereParts = [
                'ta.teacher_id = :facultyId',
                'ta.is_active = 1',
            ];

            const hasNumericDepartmentId = typeof department_id === 'number';
            const hasNumericProgramId = typeof program_id === 'number';
            const hasNumericClassId = typeof class_id === 'number';
            const hasNumericSectionId = typeof section_id === 'number';

            if (department_id) {
                whereParts.push(
                    hasNumericDepartmentId
                        ? 'p.department_id = :department_id'
                        : '(LOWER(d.name) LIKE LOWER(:department_name) OR LOWER(d.code) LIKE LOWER(:department_name))'
                );
            }

            if (program_id) {
                whereParts.push(
                    hasNumericProgramId
                        ? 's.program_id = :program_id'
                        : '(LOWER(p.name) LIKE LOWER(:program_name) OR LOWER(p.code) LIKE LOWER(:program_name))'
                );
            }

            if (class_id) {
                whereParts.push(
                    hasNumericClassId
                        ? 's.class_id = :class_id'
                        : '(LOWER(c.name) LIKE LOWER(:class_name) OR LOWER(c.code) LIKE LOWER(:class_name))'
                );
            }

            if (section_id) {
                whereParts.push(
                    hasNumericSectionId
                        ? 's.section_id = :section_id'
                        : '(LOWER(sec.name) LIKE LOWER(:section_name) OR LOWER(sec.code) LIKE LOWER(:section_name))'
                );
            }
            if (roll_number) whereParts.push('s.roll_number LIKE :roll_number');
            if (student_id) whereParts.push('s.student_id LIKE :student_id');
            if (student_name) whereParts.push('s.student_name LIKE :student_name');

            const whereClause = whereParts.join(' AND ');

            const assignmentsQuery = `
            SELECT 
                ta.id AS assignment_id,
                ta.title,
                ta.type,
                ta.due_date,
                ta.maximum_marks,
                sub.name AS subject_name,
                s.id AS student_pk,
                s.student_id,
                s.student_name,
                s.roll_number,
                
                p.name AS program_name,
                c.name AS class_name,
                sec.name AS section_name,
                asub.id AS submission_id,
                asub.submitted_at,
                asub.file_url,
                asub.marks_obtained,
                asub.grade,
                asub.feedback,
                asub.status
            FROM teacher_assignments ta
            INNER JOIN student_assignment_submissions asub 
                ON ta.id = asub.teacher_assignment_id
            INNER JOIN students s 
                ON asub.student_id = s.id
            LEFT JOIN subjects sub 
                ON ta.subject_id = sub.id
            LEFT JOIN programs p ON s.program_id = p.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE ${whereClause}
            ORDER BY asub.submitted_at DESC
            LIMIT :limit OFFSET :offset
            `;

            const countQuery = `
            SELECT COUNT(*) AS total
            FROM teacher_assignments ta
            INNER JOIN student_assignment_submissions asub 
                ON ta.id = asub.teacher_assignment_id
            INNER JOIN students s 
                ON asub.student_id = s.id
            LEFT JOIN programs p ON s.program_id = p.id
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE ${whereClause}
            `;
            const sequelize = getTenantSequelize(tenant);

            // const replacements: any = {
            //     facultyId,
            //     // stream,
            //     program_id,
            //     class_id,
            //     section_id,
            //     roll_number: roll_number ? `%${roll_number}%` : undefined,
            //     student_id: student_id ? `%${student_id}%` : undefined,
            //     student_name: student_name ? `%${student_name}%` : undefined,
            //     limit,
            //     offset,
            // };
            const replacements: any = {
                facultyId,
                limit,
                offset,
            };

            if (department_id) {
                if (hasNumericDepartmentId) replacements.department_id = department_id;
                else replacements.department_name = `%${String(department_id).trim()}%`;
            }

            if (program_id) {
                if (hasNumericProgramId) replacements.program_id = program_id;
                else replacements.program_name = `%${String(program_id).trim()}%`;
            }

            if (class_id) {
                if (hasNumericClassId) replacements.class_id = class_id;
                else replacements.class_name = `%${String(class_id).trim()}%`;
            }

            if (section_id) {
                if (hasNumericSectionId) replacements.section_id = section_id;
                else replacements.section_name = `%${String(section_id).trim()}%`;
            }

            if (roll_number) replacements.roll_number = `%${roll_number}%`;
            if (student_id) replacements.student_id = `%${student_id}%`;
            if (student_name) replacements.student_name = `%${student_name}%`;

            const [assignments, countResult] = await Promise.all([
                sequelize.query(assignmentsQuery, {
                    replacements,
                    type: QueryTypes.SELECT,
                }),
                sequelize.query(countQuery, {
                    replacements,
                    type: QueryTypes.SELECT,
                }),
            ]);

            const total = (countResult[0] as any)?.total || 0;

            return {
                assignments,
                total,
                page,
                limit,
            };
        } catch (error) {
            console.error("Error fetching faculty assignments:", error);
            throw new AppError("Failed to fetch assignments", 500);
        }
    }

    async getSubmittedAssignmentBySubmissionId(
        submissionId: number,
        facultyId: number,
        tenant: string
    ): Promise<any> {
        try {
            const query = `
            SELECT 
                ta.id AS assignment_id,
                ta.title,
                ta.type,
                ta.due_date,
                ta.description,
                ta.maximum_marks,
                sub.name AS subject_name,
                s.id AS student_id,
                s.student_name AS student_name,
                s.roll_number,
                
                p.name AS program,
                c.name AS class,
                sec.name AS section,
                asub.id AS submission_id,
                asub.submitted_at,
                asub.file_url,
                asub.submission_text,
                asub.status,
                asub.marks_obtained,
                asub.grade,
                asub.feedback
            FROM student_assignment_submissions asub 
            INNER JOIN teacher_assignments ta 
                ON ta.id = asub.teacher_assignment_id
            INNER JOIN students s 
                ON asub.student_id = s.id
            LEFT JOIN subjects sub 
                ON ta.subject_id = sub.id
             LEFT JOIN programs p ON s.program_id = p.id
             LEFT JOIN classes c ON s.class_id = c.id
             LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE asub.id = :submissionId AND ta.teacher_id = :facultyId
            `;
            const sequelize = getTenantSequelize(tenant);
            const [submission]: any = await sequelize.query(query, {
                replacements: { submissionId, facultyId },
                type: QueryTypes.SELECT,
            });

            return submission || null;

        } catch (error) {
            console.error("Error fetching submission details:", error);
            throw new AppError("Failed to fetch submission details", 500);
        }
    }

    async gradeSubmission(
        submissionId: number,
        data: { marks_obtained: number; feedback?: string; graded_by: number },
        tenant: string
    ): Promise<any> {
        try {
            const sequelize = getTenantSequelize(tenant);
            const { AssignmentSubmission } = getTenantModels(tenant);
            const submission = await AssignmentSubmission.findByPk(submissionId);
            if (!submission) {
                throw new AppError('Submission not found', 404);
            }

            // Verify teacher has right to grade this submission
            const assignment = await sequelize.query(
                `SELECT teacher_id, maximum_marks FROM teacher_assignments WHERE id = :assignmentId`,
                {
                    replacements: { assignmentId: submission.teacher_assignment_id },
                    type: QueryTypes.SELECT
                }
            ) as any[];

            if (!assignment || assignment.length === 0) {
                 throw new AppError('Assignment not found', 404);
            }

            if (assignment[0].teacher_id !== data.graded_by) {
                throw new AppError('Unauthorized to grade this assignment', 403);
            }

            if (data.marks_obtained > assignment[0].maximum_marks) {
               throw new AppError(`Marks obtained cannot exceed maximum marks (${assignment[0].maximum_marks})`, 400); 
            }

            if (data.marks_obtained < 0) {
                throw new AppError('Marks obtained cannot be less than 0', 400);
            }

            const grade = this.calculateGrade(Number(data.marks_obtained));

            await submission.update({
                marks_obtained: data.marks_obtained,
                grade,
                feedback: data.feedback,
                graded_by: data.graded_by,
                graded_at: new Date(),
                status: 'graded'
            });

            return submission;
        } catch (error) {
            console.error("Error grading submission:", error);
            if (error instanceof AppError) throw error;
            throw new AppError("Failed to grade submission", 500);
        }
    }
}

// Create and export instance
export const assignmentService = new AssignmentService();
