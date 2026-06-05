import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';
import { fileUrl } from '../middleware/upload.middleware';

const assignmentService = new AssignmentService();

export const listMyAssignments = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const { class_id, subject_id, status } = req.query;

  const studentId = user.user_code || user.student_id || user.username;
  if (!studentId) return sendError(res, 400, 'Could not resolve student ID from token');

  const filters: any = {};
  if (class_id) filters.class_id = Number(class_id);
  if (subject_id) filters.subject_id = Number(subject_id);
  if (status) filters.status = status as string;

  const result = await assignmentService.listMyAssignments(studentId, filters, tenant);
  sendSuccess(res, result, 'Assignments retrieved successfully');
});

export const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const { id } = req.params;

  const studentId = user.user_code || user.student_id || user.username;
  if (!studentId) return sendError(res, 400, 'Could not resolve student ID from token');

  const assignment = await assignmentService.getAssignmentById(id, studentId, tenant);
  sendSuccess(res, assignment, 'Assignment retrieved successfully');
});

export const submitAssignment = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const { assignment_id, submission_text } = req.body;

  const studentId = user.user_code || user.student_id || user.username;
  if (!studentId) return sendError(res, 400, 'Could not resolve student ID from token');
  if (!assignment_id) return sendError(res, 400, 'assignment_id is required');
  if (!req.file && !submission_text) {
    return sendError(res, 400, 'Either a file or submission_text is required');
  }

  const result = await assignmentService.submitAssignment(
    {
      assignmentId: assignment_id,
      studentId,
      fileUrl: fileUrl(req.file),
      submissionText: submission_text,
    },
    tenant
  );

  sendSuccess(res, result, 'Assignment submitted successfully');
});
