import { NextFunction } from "express";
import { AppError } from "../utils/appError";
import { QueryTypes } from "sequelize";
import path from "path";
import fs from "fs";
import { assignmentUploadsDir } from "../middleware/uploadMiddleware";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

interface AssignmentStats {
  total_assignments: number;
  pending_assignments: number;
  submitted_assignments: number;
  overdue_assignments: number;
}

// Helper function to get student_id from authenticated user
async function getStudentFromUser(user: any, tenant: string): Promise<any> {
  if (!user) {
    throw new AppError('Authentication required', 401);
  }
  const { Student } = getTenantModels(tenant);
  // Try to find student by email
  let stud = await Student.findOne({
    where: {
      email: user.email
    }
  });

  return stud;
}


export async function getStudentAssignmentsAndStats(req, res, next: NextFunction) {
  try {
    const student = await getStudentFromUser(req.user, req.tenant);
    console.log(student);
    const query = `
      SELECT 
          ta.id, 
          ta.title, 
          sub.id AS subject_id, 
          sub.name AS subject_name, 
          ta.type, 
          ta.due_date, 
          asub.id AS assignment_submission_id, 

          CASE 
              WHEN asub.id IS NOT NULL THEN 'Submitted'
              WHEN asub.id IS NULL AND ta.due_date < CURDATE() THEN 'Overdue'
              ELSE 'Pending'
          END AS status 

      FROM teacher_assignments ta 

      INNER JOIN students st 
          ON st.id = :studentId

      INNER JOIN student_personal_details spd 
          ON spd.student_id = st.id

      LEFT JOIN subjects sub 
          ON ta.subject_id = sub.id 

      LEFT JOIN student_assignment_submissions asub 
          ON ta.id = asub.teacher_assignment_id 
          AND asub.student_id = st.id 
          AND asub.status IN ('submitted', 'graded')

      -- Corrected matching logic
      WHERE 
          ta.program_id = spd.program_id
          AND ta.class_id = spd.class_id
          AND ta.semester_id = st.semester_id          
      ORDER BY ta.id DESC
    `;
    const sequelize = getTenantSequelize(req.tenant);

    const assignments = await sequelize.query(query, {
      replacements: { studentId: student.id },
      type: QueryTypes.SELECT,
    });

    // Query for statistics 
    const statsQuery = `
      SELECT 
          COUNT(*) AS total_assignments,
          SUM(CASE WHEN asub.id IS NULL THEN 1 ELSE 0 END) AS pending_assignments,
          SUM(CASE WHEN asub.id IS NOT NULL THEN 1 ELSE 0 END) AS submitted_assignments,
          SUM(
            CASE 
              WHEN asub.id IS NULL AND ta.due_date < CURDATE() 
              THEN 1 
              ELSE 0 
            END
          ) AS overdue_assignments
      FROM teacher_assignments ta
      INNER JOIN students st 
          ON st.id = :studentId
      INNER JOIN student_personal_details spd 
          ON spd.student_id = st.id
      LEFT JOIN student_assignment_submissions asub 
          ON ta.id = asub.teacher_assignment_id
          AND asub.student_id = st.id
          AND asub.status IN ('submitted', 'graded')
      WHERE 
          ta.program_id = spd.program_id
          AND ta.class_id = spd.class_id
          AND ta.semester_id = st.semester_id          
    `;
    const [statsRow] = await sequelize.query<AssignmentStats>(statsQuery, {
      replacements: { studentId: student.id },
      type: QueryTypes.SELECT,
    });
    const total = statsRow.total_assignments;
    const submitted = statsRow.submitted_assignments;
    const pending = statsRow.pending_assignments;
    const overdue = statsRow.overdue_assignments;

    // Completed rate = submitted / total * 100
    const completedRate = total > 0 ? (submitted / total) * 100 : 0;

    // Remaining (pending + overdue) = total - submitted
    const remainingRate = total > 0 ? ((pending + overdue) / total) * 100 : 0;

    return res.status(200).json({
      status: "success",
      message: "Assignments fetched successfully",
      data: {
        assignments,
        stats: {
          total: statsRow.total_assignments,
          pending: statsRow.pending_assignments,
          submitted: statsRow.submitted_assignments,
          overdue: statsRow.overdue_assignments,
          graded: 0,
          avgGrade: null,
        },
        chart: {
          completedRate: completedRate.toFixed(2),
          remainingRate: remainingRate.toFixed(2),
        }
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFilteredAssignments(req, res, next: NextFunction) {
  try {
    const student = await getStudentFromUser(req.user, req.tenant);
    const { departmentId, status } = req.query;

    let query = `
      SELECT 
        ta.id, 
        ta.title, 
        sub.name AS subject_name, 
        ta.type, 
        ta.due_date,  
        (ta.allow_late_submissions = 1) AS allow_late_submissions, 
        asub.id AS assignment_submission_id,

        CASE 
          WHEN asub.id IS NOT NULL THEN 'Submitted'
          WHEN asub.id IS NULL AND ta.due_date < CURDATE() THEN 'Overdue'
          ELSE 'Pending'
        END AS status

      FROM teacher_assignments ta

      INNER JOIN students st 
        ON st.id = :studentId

      INNER JOIN student_personal_details spd 
        ON spd.student_id = st.id

      -- Corrected matching logic
      WHERE 
        ta.program_id = spd.program_id
        AND ta.class_id = spd.class_id
        AND ta.semester_id = st.semester_id        

      LEFT JOIN subjects sub 
        ON ta.subject_id = sub.id

      LEFT JOIN student_assignment_submissions asub 
        ON ta.id = asub.teacher_assignment_id
        AND asub.student_id = st.id
        AND asub.status IN ('submitted', 'graded')
    `;

    if (departmentId) {
      query += ` AND sub.department_id = :departmentId`;
    }

    if (status) {
      query += ` HAVING status = :status`;
    }

    query += ` ORDER BY ta.due_date ASC`;

    const sequelize = getTenantSequelize(req.tenant);

    const assignments = await sequelize.query(query, {
      replacements: {
        studentId: student.id,
        departmentId: departmentId || null,
        status: status || null
      },
      type: QueryTypes.SELECT,
    });

    return res.status(200).json({
      status: "success",
      message: "Filtered assignments fetched successfully",
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitAssignment(req, res, next: NextFunction) {
  try {
    const student = await getStudentFromUser(req.user, req.tenant);
    const { teacherAssignmentId, submissionText } = req.body;

    // Handle file upload if provided
    let fileUrl = null;
    if (req.file) {
      // Generate the file URL path based on the uploaded file
      fileUrl = `/api/student/assignments/${teacherAssignmentId}/files/${req.file.filename}`;
    }

    const upsertQuery = `INSERT INTO student_assignment_submissions 
        (teacher_assignment_id, student_id, submission_text, file_url, submitted_at, marks_obtained, grade, feedback, graded_at, graded_by, status, created_at, updated_at) 
        VALUES (:teacherAssignmentId, :studentId, :submissionText, :fileUrl, NOW(), NULL, NULL, NULL, NULL, NULL, 'submitted', NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          submission_text = VALUES(submission_text),
          file_url = VALUES(file_url),
          submitted_at = VALUES(submitted_at),
          marks_obtained = NULL,
          grade = NULL,
          feedback = NULL,
          graded_at = NULL,
          graded_by = NULL,
          status = 'submitted',
          updated_at = NOW();`;

    const sequelize = getTenantSequelize(req.tenant);

    await sequelize.query(upsertQuery, {
      replacements: {
        teacherAssignmentId, studentId: student.id,
        submissionText: submissionText || null,
        fileUrl: fileUrl,
      },
      type: QueryTypes.INSERT,
    });

    try {
      // Find teacher user_id, assignment title, and the new submission_id
      const teacherRes: any[] = await sequelize.query(`
        SELECT COALESCE(t.user_id, u.user_id) AS user_id, ta.title AS assignment_title, sas.id AS submission_id
        FROM teacher_assignments ta
        JOIN teachers t ON ta.teacher_id = t.id
        LEFT JOIN users u ON u.email COLLATE utf8mb4_general_ci = t.email COLLATE utf8mb4_general_ci
        JOIN student_assignment_submissions sas ON sas.teacher_assignment_id = ta.id AND sas.student_id = :studentId
        WHERE ta.id = :teacherAssignmentId
      `, {
        replacements: { teacherAssignmentId, studentId: student.id },
        type: QueryTypes.SELECT
      });

      if (teacherRes && teacherRes.length > 0 && teacherRes[0].user_id) {
        const teacherUserId = teacherRes[0].user_id;
        const assignmentTitle = teacherRes[0].assignment_title || 'Assignment';
        const submissionId = teacherRes[0].submission_id;
        const studentName = student.first_name + ' ' + (student.last_name || '');

        await sequelize.query(`
          INSERT INTO notifications (user_id, title, message, type, channel, link, is_read, created_at, updated_at)
          VALUES (:userId, 'Assignment Submitted', :message, 'info', 'IN_APP', :link, 0, NOW(), NOW())
        `, {
          replacements: {
            userId: teacherUserId,
            message: `Student ${studentName} has submitted the assignment '${assignmentTitle}'.`,
            link: submissionId ? `/teacher/assignment-check/${submissionId}` : `/teacher/assignment-check`
          },
          type: QueryTypes.INSERT
        });
      }
    } catch (notifErr) {
      console.error("[ASSIGNMENT SUBMISSION] Failed to notify teacher:", notifErr);
    }

    const responseData: any = {
      status: "success",
      message: "Assignment submitted successfully"
    };

    // Include file info in response if file was uploaded
    if (req.file) {
      responseData.data = {
        uploadedFile: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          url: fileUrl,
          size: req.file.size
        }
      };
    }

    return res.status(201).json(responseData);
  }
  catch (error) {
    // Clean up uploaded file if database insertion fails
    if (req.file && req.file.path) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (fileError) {
        console.error('Error cleaning up uploaded file:', fileError);
      }
    }
    next(error);
  }
}

/**
 * Serve assignment submission files - Public access with verification
 */
export async function serveAssignmentFile(req, res, next: NextFunction) {
  try {
    const { assignmentId, filename } = req.params;

    const filePath = path.join(assignmentUploadsDir, filename);

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on server', 404);
    }

    // Get file stats for content length
    const stats = fs.statSync(filePath);

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream'; // default

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
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };

    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    next(error);
  }
}

export async function getSubmittedAssignmentById(req, res, next: NextFunction) {
  try {
    const { id, studentId } = req.params;

    if (!id) {
      throw new AppError("Assignment submission ID not provided", 400);
    }

    const query = `
      SELECT 
            asub.id AS submission_id,
            asub.teacher_assignment_id,
            ta.title AS assignment_title,
            ta.description AS assignment_description,
            ta.due_date,
            asub.submission_text,
            asub.file_url,
            asub.submitted_at,
            asub.status,
            asub.is_late_submission,
            asub.grade,
            asub.marks_obtained,
            ta.maximum_marks,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'attachment_id', aat.id,
                'file_name', aat.file_name,
                'file_url', aat.file_url
              )
            ) AS attachments
        FROM student_assignment_submissions asub
        INNER JOIN teacher_assignments ta 
          ON asub.teacher_assignment_id = ta.id
        LEFT JOIN teacher_assignment_attachments aat
          ON ta.id = aat.teacher_assignment_id
        WHERE asub.id = :id        
          AND asub.status IN ('submitted', 'graded')
        GROUP BY asub.id, asub.teacher_assignment_id, ta.title, ta.description, ta.due_date,
                asub.submission_text, asub.file_url, asub.submitted_at, asub.status, asub.is_late_submission, asub.grade, asub.marks_obtained, ta.maximum_marks
        ORDER BY ta.due_date ASC;        
    `;
    const sequelize = getTenantSequelize(req.tenant);
    const [submission]: any = await sequelize.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });

    if (!submission) {
      throw new AppError("Submitted assignment not found or already graded", 404);
    }

    // Build absolute document URLs for UI consumption
    const toAbsoluteUrl = (p?: string | null) => {
      if (!p) return null;
      return p.startsWith('/') ? `${req.protocol}://${req.get('host')}${p}` : p;
    };

    const document = { submitted_file: toAbsoluteUrl((submission as any).file_url) };
    let attachments: any[] = [];
    try {
      attachments = typeof submission.attachments === "string" ? JSON.parse(submission.attachments) : submission.attachments;
    } catch {
      attachments = [];
    }

    const transformedAttachments = attachments.map(att => ({ ...att, file_url: toAbsoluteUrl(att.file_url) }));

    return res.json({
      status: "success",
      data: { submission, document, transformedAttachments },
      message: "Submitted assignment is successfully fetched"
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    console.error("Error fetching submitted assignment:", error);
    return next(new AppError("Failed to fetch submitted assignment", 500));
  }
}

export async function getAssignmentById(req, res, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Assignment ID not provided", 400);
    }

    const query = `
      SELECT 
            ta.title AS assignment_title,
            ta.description AS assignment_description,
            ta.due_date,
            ta.due_time,
            (ta.allow_late_submissions = 1) AS allow_late_submissions,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'attachment_id', aat.id,
                'file_name', aat.file_name,
                'file_url', aat.file_url
              )
            ) AS attachments
        FROM teacher_assignments ta
        INNER JOIN teacher_assignment_attachments aat 
          ON ta.id = aat.teacher_assignment_id
        WHERE ta.id = :id
        GROUP BY ta.id;    
    `;
    const sequelize = getTenantSequelize(req.tenant);
    const [assignment]: any = await sequelize.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });

    if (!assignment) {
      throw new AppError("assignment not found or already graded", 404);
    }

    // Build absolute document URLs for UI consumption
    const toAbsoluteUrl = (p?: string | null) => {
      if (!p) return null;
      return p.startsWith('/') ? `${req.protocol}://${req.get('host')}${p}` : p;
    };

    let attachments: any[] = [];
    try {
      attachments = typeof assignment.attachments === "string" ? JSON.parse(assignment.attachments) : assignment.attachments;
    } catch {
      attachments = [];
    }

    const transformedAttachments = attachments.map(att => ({ ...att, file_url: toAbsoluteUrl(att.file_url) }));

    const responseData = { ...assignment, attachments: transformedAttachments };

    return res.json({
      status: "success",
      data: responseData,
      message: "Submitted assignment is successfully fetched"
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    console.error("Error fetching assignment:", error);
    return next(new AppError("Failed to fetch assignment", 500));
  }
}
