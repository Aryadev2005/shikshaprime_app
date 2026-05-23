import { Request, Response, NextFunction } from "express";
import { FacultyService } from "../services/facultyService";
import { assignmentService } from "../services/assignmentService";
import { AppError } from "../utils/appError";
import { QueryTypes } from "sequelize";
import path from "path";
import fs from "fs";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

const facultyService = new FacultyService();

// Helper function to get faculty_id from authenticated user
async function getFacultyIdFromUser(user: any, tenant: string): Promise<number> {
          if (!user) {
                    throw new AppError('Authentication required', 401);
          }

          console.log('[getFacultyIdFromUser] Looking up faculty for user:', {
                    email: user.email,
                    username: user.username
          });

          // Try to find faculty by email
          const { Teacher } = getTenantModels(tenant);
          let faculty = await Teacher.findOne({
                    where: {
                              email: user.email || '',
                              is_active: true,
                    }
          });

          // If not found by email, try to find by employee_id matching username
          if (!faculty && user.username) {
                    faculty = await Teacher.findOne({
                              where: {
                                        employee_id: user.username,
                                        is_active: true
                              }
                    });
          }

          // If still not found, get the first active faculty (for development/testing)
          if (!faculty) {
                    console.log('[getFacultyIdFromUser] No matching faculty found, using first active faculty');
                    faculty = await Teacher.findOne({
                              where: {
                                        is_active: true
                              },
                              order: [['id', 'ASC']]
                    });
          }

          if (!faculty) {
                    throw new AppError('No faculty profiles exist in the system', 404);
          }

          console.log('[getFacultyIdFromUser] Using faculty:', { id: faculty.id, name: faculty.first_name });
          return faculty.id;
}

function parseFilterValue(value: unknown): number | string | undefined {
          if (typeof value !== 'string') {
                    return undefined;
          }

          const trimmed = value.trim();

          if (!trimmed) {
                    return undefined;
          }

          if (/^\d+$/.test(trimmed)) {
                    return parseInt(trimmed, 10);
          }

          return trimmed;
}

export async function createFaculty(req, res: Response, next: NextFunction) {
          try {
                    if (!req.body.first_name || !req.body.last_name) {
                              throw new AppError('employee_id and employee_name are required', 400);
                    }

                    const employee_id = await facultyService.generateEmployeeId(req.tenant);

                    const payload = { ...req.body, employee_id };

                    const faculty = await facultyService.createFaculty(payload, req.tenant);

                    return res.status(201).json({
                              status: "success",
                              message: 'Faculty created successfully',
                              data: faculty,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getAllFaculty(req, res: Response, next: NextFunction) {
          try {
                    const { department_id, designation, is_hod } = req.query;

                    const filters: any = {};
                    if (department_id) filters.department_id = Number(department_id);
                    if (designation) filters.designation = designation;
                    if (is_hod !== undefined) filters.is_hod = is_hod === 'true';

                    const faculty = await facultyService.getAllFaculty(filters, req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Faculty fetched successfully',
                              data: {
                                        count: faculty.length,
                                        rows: faculty
                              },
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getFacultyById(req, res: Response, next: NextFunction) {
          try {
                    const { id } = req.params;
                    const faculty = await facultyService.getFacultyById(Number(id), req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Faculty fetched successfully',
                              data: faculty,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getFacultyByUserId(req, res: Response, next: NextFunction) {
          try {
                    const { id } = req.params;
                    const faculty = await facultyService.getFacultyByUserId(Number(id), req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Faculty fetched successfully',
                              data: faculty,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getFacultyByEmployeeId(req, res: Response, next: NextFunction) {
          try {
                    const { employeeId } = req.params;
                    const faculty = await facultyService.getFacultyByEmployeeId(employeeId as string, req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Faculty fetched successfully',
                              data: faculty,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function updateFaculty(req, res: Response, next: NextFunction) {
          try {
                    const { id } = req.params;
                    const faculty = await facultyService.updateFaculty(Number(id), req.body, req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Faculty updated successfully',
                              data: faculty,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function deleteFaculty(req
    , res: Response, next: NextFunction) {
          try {
                    const { id } = req.params;
                    await facultyService.deleteFaculty(Number(id), req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Faculty deleted successfully',
                              data: null,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function searchFaculty(req, res: Response, next: NextFunction) {
          try {
                    const { q } = req.query;

                    if (!q) {
                              throw new AppError('Search query (q) is required', 400);
                    }

                    const faculty = await facultyService.searchFaculty(q as string, req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Search completed successfully',
                              data: {
                                        count: faculty.length,
                                        rows: faculty
                              },
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getFacultyByDepartment(req, res: Response, next: NextFunction) {
          try {
                    const { departmentId } = req.params;
                    const faculty = await facultyService.getFacultyByDepartment(Number(departmentId), req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Faculty fetched successfully',
                              data: {
                                        count: faculty.length,
                                        rows: faculty
                              },
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getFacultyStats(req, res: Response, next: NextFunction) {
          try {
                    const stats = await facultyService.getFacultyStats(req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Statistics fetched successfully',
                              data: stats,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getTeacherDashboard(req, res: Response, next: NextFunction) {
          try {
                    const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
                    const dashboard = await facultyService.getTeacherDashboardData(facultyId, req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: "Teacher dashboard fetched successfully",
                              data: dashboard,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getMyTeacherProfilePage(req, res: Response, next: NextFunction) {
          try {
                    const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
                    const requestedYear = Number(req.query.year);
                    const year = Number.isFinite(requestedYear) ? requestedYear : undefined;
                    const profile = await facultyService.getTeacherProfilePageData(facultyId, req.tenant, year);

                    return res.status(200).json({
                              status: "success",
                              message: "Teacher profile fetched successfully",
                              data: profile,
                    });
          } catch (error) {
                    next(error);
          }
}

// ====================== ASSIGNMENT CONTROLLERS ======================

export async function createAssignment(req, res: Response, next: NextFunction) {
        console.log(req.body);
          try {
                    const {
                              title,
                              description,
                              detailed_instructions,
                              type,
                              subject_id,
                              program_id,
                              semester_id,
                              section_id,
                              academic_year_id,
                              class_id,
                              due_date,
                              due_time,
                              maximum_marks,
                              allow_late_submissions,
                              send_notification
                    } = req.body;

                    if (!title || !type || !subject_id || !due_date || !due_time) {
                              throw new AppError('Required fields: title, type, subject_id, due_date, due_time', 400);
                    }

                    // Get faculty_id by looking up the faculty record using the authenticated user's email
                    const faculty_id = await getFacultyIdFromUser(req.user, req.tenant);

                    const assignmentData = {
                              faculty_id,
                              title,
                              description,
                              detailed_instructions,
                              type,
                              subject_id,
                              program_id: program_id || 1,
                              semester_id: semester_id || 1,
                              section_id,
                              class_id,
                              academic_year_id: academic_year_id || 1,
                              due_date,
                              due_time,
                              maximum_marks: maximum_marks || 100,
                              allow_late_submissions: allow_late_submissions || false,
                              send_notification: send_notification || true
                    };

                    const assignmentId = await assignmentService.createAssignment(assignmentData, req.tenant);

                    // Handle file uploads if any files are attached
                    let attachments = [];
                    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                              attachments = await assignmentService.createAssignmentAttachments(
                                        assignmentId.valueOf(),
                                        req.files as any[],
                                        req.tenant
                              );
                    }
                    return res.status(201).json({
                              status: "success",
                              message: 'Assignment created successfully',
                              data: assignmentId,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getFacultyAssignments(req, res: Response, next: NextFunction) {
          try {
                    // Get faculty_id by looking up the faculty record using the authenticated user's email
                    const faculty_id = await getFacultyIdFromUser(req.user, req.tenant);

                    const {
                              type,
                              subject_id,
                              program_id,
                              section_id,
                              status = 'active',
                              page = 1,
                              limit = 10
                    } = req.query;

                    const filters = {
                              type: type as 'Assignment' | 'Homework',
                              subject_id: subject_id ? parseInt(subject_id as string) : undefined,
                              program_id: program_id ? parseInt(program_id as string) : undefined,
                              section_id: section_id ? parseInt(section_id as string) : undefined,
                              status: status as 'active' | 'inactive' | 'all',
                              page: parseInt(page as string),
                              limit: parseInt(limit as string)
                    };

                    const result = await assignmentService.getFacultyAssignments(faculty_id, filters, req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Assignments fetched successfully',
                              data: result,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function getAssignmentById(req, res: Response, next: NextFunction) {
          try {
                    const { assignmentId } = req.params;
                    const faculty_id = req.user?.id;

                    if (!assignmentId) {
                              throw new AppError('Assignment ID is required', 400);
                    }

                    const assignment = await assignmentService.getAssignmentById(parseInt(assignmentId), parseInt(faculty_id as string), req.tenant);

                    if (!assignment) {
                              throw new AppError('Assignment not found', 404);
                    }

                    // Fetch attachments for the assignment
                    const attachments = await assignmentService.getAssignmentAttachments(parseInt(assignmentId), req.tenant);

                    // Build absolute document URLs for UI consumption
                    const toAbsoluteUrl = (p?: string | null) => {
                        if (!p) return null;
                        return p.startsWith('/') ? `${req.protocol}://${req.get('host')}${p}` : p;
                    };

                    let assignmentAttachments = [];

                    if (attachments && attachments.length > 0) { 
                        for (const attachment of attachments) { 
                            assignmentAttachments.push({
                                id: attachment.id,
                                fileName: attachment.file_name,
                                fileUrl: toAbsoluteUrl(attachment.file_url)
                            });
                        } 
                    }
                    return res.status(200).json({
                              status: "success",
                              message: 'Assignment fetched successfully',
                              data: {
                                        ...assignment,
                                        attachments: assignmentAttachments
                              },
                    });
          } catch (error) {
                    next(error);
          }
}

export async function updateAssignment(req, res: Response, next: NextFunction) {
          try {
                    const { assignmentId } = req.params;
                    const faculty_id = req.user?.id;

                    if (!assignmentId) {
                              throw new AppError('Assignment ID is required', 400);
                    }

                    const assignment = await assignmentService.updateAssignment(
                              parseInt(assignmentId),
                              req.body,
                              parseInt(faculty_id as string),
                              req.tenant
                    );

                    if (!assignment) {
                              throw new AppError('Assignment not found or update failed', 404);
                    }

                    return res.status(200).json({
                              status: "success",
                              message: 'Assignment updated successfully',
                              data: assignment,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function deleteAssignment(req, res: Response, next: NextFunction) {
          try {
                    const { assignmentId } = req.params;
                    const faculty_id = req.user?.id;

                    if (!assignmentId) {
                              throw new AppError('Assignment ID is required', 400);
                    }

                    const deleted = await assignmentService.deleteAssignment(parseInt(assignmentId), parseInt(faculty_id as string), req.tenant);


                    if (!deleted) {
                              throw new AppError('Assignment not found or deletion failed', 404);
                    }

                    return res.status(200).json({
                              status: "success",
                              message: 'Assignment deleted successfully',
                    });
          } catch (error) {
                    next(error);
          }
}

// Faculty Class Assignment Controllers
export async function createFacultyAssignment(req, res: Response, next: NextFunction) {
          try {
                    const { id } = req.params;
                    const facultyId = parseInt(id);
                    
                    if (!facultyId) {
                              throw new AppError('Faculty ID is required', 400);
                    }

                    const {
                              program_id,
                              class_id,
                              semester_id,
                              section_id,
                              academic_year_id,
                              is_class_incharge,
                              subject_id
                    } = req.body;

                    if (!program_id || !academic_year_id || !class_id) {
                              throw new AppError('program_id, academic_year_id, and class_id are required', 400);
                    }

                    const assignmentData = {
                              program_id,
                              class_id,
                              semester_id: semester_id || class_id, // Use class_id as semester_id if not provided
                              section_id,
                              academic_year_id,
                              is_class_incharge: is_class_incharge || false,
                              subject_id
                    };

                    const assignment = await facultyService.createAssignment(facultyId, assignmentData, req.tenant);

                    return res.status(201).json({
                              status: "success",
                              message: 'Faculty assignment created successfully',
                              data: assignment,
                    });
          } catch (error) {
                    next(error);
          }
}

export async function deleteFacultyAssignment(req, res: Response, next: NextFunction) {
          try {
                    const { assignmentId } = req.params;
                    
                    if (!assignmentId) {
                              throw new AppError('Assignment ID is required', 400);
                    }

                    await facultyService.deleteAssignment(parseInt(assignmentId), req.tenant);

                    return res.status(200).json({
                              status: "success",
                              message: 'Faculty assignment deleted successfully',
                              data: null,
                    });
          } catch (error) {
                    next(error);
          }
}

// Metadata Controllers - Fetching from Database where applicable

export async function getPrograms(req, res: Response, next: NextFunction) {
    try {
            const sequelize = getTenantSequelize(req.tenant);
            const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
            const results = await sequelize.query<any>(
                `SELECT distinct p.id, p.code, p.name FROM programs p
                    INNER JOIN teacher_class_subjects tc ON  p.id = tc.program_id
                    WHERE tc.teacher_id = :teacherId
                    ORDER BY p.id`,
                { 
                    replacements: { teacherId: facultyId },
                    type: QueryTypes.SELECT 
                }
            );

            return res.status(200).json({
                        status: "success",
                        message: 'Programs fetched successfully',
                        data: results,
            });
    } catch (error) {
            next(error);
    }
}

export async function getDepartments(req, res: Response, next: NextFunction) {
    try {
            const sequelize = getTenantSequelize(req.tenant);
            const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
            const results = await sequelize.query<any>(
                `SELECT DISTINCT d.id, d.code, d.name
                    FROM departments d
                    INNER JOIN programs p ON p.department_id = d.id
                    INNER JOIN teacher_classes tc ON tc.program_id = p.id
                    WHERE tc.teacher_id = :teacherId
                    ORDER BY d.name`,
                {
                    replacements: { teacherId: facultyId },
                    type: QueryTypes.SELECT
                }
            );

            return res.status(200).json({
                        status: "success",
                        message: 'Departments fetched successfully',
                        data: results,
            });
    } catch (error) {
            next(error);
    }
}

export async function getSections(req, res: Response, next: NextFunction) {
    try {
            const sequelize = getTenantSequelize(req.tenant);
            const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
            const results = await sequelize.query<any>(
                `SELECT distinct sec.id, sec.code, sec.name FROM sections sec
                    INNER JOIN teacher_class_subjects tc ON  tc.program_id = sec.program_id
                    and tc.class_id = sec.class_id 
                    WHERE tc.teacher_id = :teacherId
                    ORDER BY sec.code`,
                { 
                    replacements: { teacherId: facultyId },
                    type: QueryTypes.SELECT 
                }
            );
            return res.status(200).json({
                        status: "success",
                        message: 'Sections fetched successfully',
                        data: results,
            });
    } catch (error) {
            next(error);
    }
}

// Replaced static controllers with database fetching

export async function getSemesters(req, res: Response, next: NextFunction) {
    try {
            const sequelize = getTenantSequelize(req.tenant);
            const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
            const results = await sequelize.query<any>(
                `SELECT distinct sem.id, sem.semester_number, sem.name FROM semesters sem
                    INNER JOIN teacher_class_subjects tc ON  tc.program_id = sem.program_id
                    and tc.class_id = sem.class_id 
                    WHERE tc.teacher_id = :teacherId
                    ORDER BY sem.semester_number`,
                { 
                    replacements: { teacherId: facultyId },
                    type: QueryTypes.SELECT 
                }
            );
            return res.status(200).json({
                        status: "success",
                        message: 'Semesters fetched successfully',
                        data: results,
            });
    } catch (error) {
            next(error);
    }
}

export async function getSubjects(req, res: Response, next: NextFunction) {
    try {
            const sequelize = getTenantSequelize(req.tenant);
            const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
            const results = await sequelize.query<any>(
                `SELECT distinct sub.id, sub.code, sub.name FROM subjects sub
                    INNER JOIN teacher_class_subjects tc ON  tc.subject_id = sub.id
                    WHERE tc.teacher_id = :teacherId
                    ORDER BY sub.code`,
                { 
                    replacements: { teacherId: facultyId },
                    type: QueryTypes.SELECT 
                }
            );

            return res.status(200).json({
                        status: "success",
                        message: 'Subjects fetched successfully',
                        data: results,
            });
    } catch (error) {
            next(error);
    }
}

export async function getAcademicYears(req, res: Response, next: NextFunction) {
    try {
            const sequelize = getTenantSequelize(req.tenant);
            const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
            const results = await sequelize.query<any>(
                `SELECT distinct ac.id, ac.name FROM academic_years ac
                    INNER JOIN teacher_class_subjects tc ON  tc.academic_year_id = ac.id
                    WHERE tc.teacher_id = :teacherId
                    ORDER BY ac.id`,
                { 
                    replacements: { teacherId: facultyId },
                    type: QueryTypes.SELECT 
                }
            );

            return res.status(200).json({
                        status: "success",
                        message: 'Academic years fetched successfully',
                        data: results,
            });
    } catch (error) {
            next(error);
    }
}

export async function getClasses(req, res: Response, next: NextFunction) {
    try {
            const sequelize = getTenantSequelize(req.tenant);
            const facultyId = await getFacultyIdFromUser(req.user, req.tenant);
            const results = await sequelize.query<any>(
                `SELECT distinct cls.id, cls.code, cls.name FROM classes cls
                    INNER JOIN teacher_class_subjects tc ON  tc.class_id = cls.id
                    WHERE tc.teacher_id = :teacherId
                    ORDER BY cls.id`,
                { 
                    replacements: { teacherId: facultyId },
                    type: QueryTypes.SELECT 
                }
            );

            return res.status(200).json({
                        status: "success",
                        message: 'Classes fetched successfully',
                        data: results,
            });
    } catch (error) {
            next(error);
    }
}

/**
 * Upload files to existing assignment
 */
export async function uploadAssignmentFiles(req, res: Response, next: NextFunction) {
    try {
        const { assignmentId } = req.params;
        const faculty_id = await getFacultyIdFromUser(req.user, req.tenant);
        
        if (!assignmentId) {
            throw new AppError('Assignment ID is required', 400);
        }

        // Verify assignment exists and belongs to the faculty
        const assignment = await assignmentService.getAssignmentById(
            parseInt(assignmentId), 
            faculty_id,
            req.tenant
        );
        
        if (!assignment) {
            throw new AppError('Assignment not found or access denied', 404);
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            throw new AppError('No files provided for upload', 400);
        }

        const attachments = await assignmentService.createAssignmentAttachments(
            parseInt(assignmentId),
            req.files as any[],
            req.tenant
        );

        return res.status(200).json({
            status: "success",
            message: 'Files uploaded successfully',
            data: { attachments },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get assignment attachments
 */
export async function getAssignmentAttachments(req, res: Response, next: NextFunction) {
    try {
        const { assignmentId } = req.params;
        const faculty_id = await getFacultyIdFromUser(req.user, req.tenant);
        
        if (!assignmentId) {
            throw new AppError('Assignment ID is required', 400);
        }

        // Verify assignment exists and belongs to the faculty (or allow students to view)
        const assignment = await assignmentService.getAssignmentById(parseInt(assignmentId), null, req.tenant);
        if (!assignment) {
            throw new AppError('Assignment not found', 404);
        }

        const attachments = await assignmentService.getAssignmentAttachments(parseInt(assignmentId), req.tenant);

        return res.status(200).json({
            status: "success",
            message: 'Attachments fetched successfully',
            data: { attachments },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Serve assignment files
 */
export async function serveAssignmentFile(req, res: Response, next: NextFunction) {
    try {
        const { assignmentId, filename } = req.params;
        
        if (!assignmentId || !filename) {
            throw new AppError('Assignment ID and filename are required', 400);
        }

        const uploadsDir = path.join(__dirname, '../../uploads/assignments');
        const filePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new AppError('File not found', 404);
        }

        // Verify the file belongs to the assignment (optional security check)
        const attachments = await assignmentService.getAssignmentAttachments(parseInt(assignmentId), req.tenant);
        const attachment = attachments.find(att => att.file_url.includes(filename));
        
        if (!attachment) {
            throw new AppError('File not associated with this assignment', 403);
        }

        // Set appropriate headers
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        
        const mimeTypes: { [key: string]: string } = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        
        if (mimeTypes[ext]) {
            contentType = mimeTypes[ext];
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);
        
        return res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
}

/**
 * Delete assignment attachment
 */
export async function deleteAssignmentAttachment(req, res: Response, next: NextFunction) {
    try {
        const { assignmentId, attachmentId } = req.params;
        const faculty_id = await getFacultyIdFromUser(req.user, req.tenant);
        
        if (!assignmentId || !attachmentId) {
            throw new AppError('Assignment ID and attachment ID are required', 400);
        }

        // Verify assignment belongs to the faculty
        const assignment = await assignmentService.getAssignmentById(
            parseInt(assignmentId), 
            faculty_id,
            req.tenant
        );
        
        if (!assignment) {
            throw new AppError('Assignment not found or access denied', 404);
        }

        const deleted = await assignmentService.deleteAssignmentAttachment(
            parseInt(attachmentId),
            parseInt(assignmentId),
            req.tenant
        );

        if (!deleted) {
            throw new AppError('Attachment not found', 404);
        }

        return res.status(200).json({
            status: "success",
            message: 'Attachment deleted successfully',
            data: { deleted: true },
        });
    } catch (error) {
        next(error);
    }
}

export async function getSubmittedAssignmentsByFacultyId(req, res, next: Function) {
     try {
        const teacherId = req.query.teacherId || await getFacultyIdFromUser(req.user, req.tenant);
        const {
            stream,
            department_id,
            program_id,
            class_id,
            section_id,
            roll_no,
            roll_number,
            rollNo,
            student_id,
            studentId,
            student_name,
            studentName,
            page = 1,
            limit = 10
        } = req.query;

        const resolvedDepartmentId =
            department_id || stream;

        const resolvedRollNumber =
            roll_number || roll_no || rollNo;

        const resolvedStudentId =
            student_id || studentId;

        const resolvedStudentName =
            student_name || studentName;

        const result = await assignmentService.getSubmittedAssignments(Number(teacherId), {
            department_id: parseFilterValue(resolvedDepartmentId),
            program_id: parseFilterValue(program_id),
            class_id: parseFilterValue(class_id),
            section_id: parseFilterValue(section_id),
            roll_number: resolvedRollNumber as string,
            student_id: resolvedStudentId as string,
            student_name: resolvedStudentName as string,
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        }, req.tenant);

        return res.status(200).json({
                              status: "success",
                              message: 'Submitted assignments fetched successfully',
                              data: result,
                    });

     } catch (error) {
        next(error);
     }
}

export async function getSubmittedAssignmentBySubmissionId(req, res: Response, next: NextFunction) {
    try {
        const { submissionId } = req.params;
        const faculty_id = await getFacultyIdFromUser(req.user, req.tenant);

        if (!submissionId) {
            throw new AppError('Submission ID is required', 400);
        }

        const submission = await assignmentService.getSubmittedAssignmentBySubmissionId(parseInt(submissionId), faculty_id, req.tenant);

        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        return res.status(200).json({
            status: "success",
            message: 'Submission fetched successfully',
            data: submission,
        });
    } catch (error) {
        next(error);
    }
}

export async function gradeSubmission(req, res: Response, next: NextFunction) {
    try {
        const { submissionId } = req.params;
        const { marks_obtained, feedback } = req.body;
        const faculty_id = await getFacultyIdFromUser(req.user, req.tenant);

        if (!submissionId) {
            throw new AppError('Submission ID is required', 400);
        }

        if (marks_obtained === undefined) {
             throw new AppError('Marks obtained are required', 400);
        }

        const result = await assignmentService.gradeSubmission(parseInt(submissionId), {
            marks_obtained,
            feedback,
            graded_by: faculty_id
        }, req.tenant);

        return res.status(200).json({
            status: "success",
            message: 'Submission graded successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}
