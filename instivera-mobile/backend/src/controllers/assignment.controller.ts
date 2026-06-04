import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';
import { assignmentService } from '../services/assignment.service';
import { GradeSubmissionRequest, CreateAssignmentRequest } from '../types/assignment.types';

export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const token = req.token as string;

  if (user.role === 'student') {
    const result = await assignmentService.getStudentAssignments(user.user_code, token, tenant);
    sendSuccess(res, result, 'Assignments fetched');
    return;
  }

  if (user.role === 'teacher') {
    const result = await assignmentService.getTeacherAssignments(token, tenant);
    sendSuccess(res, result, 'Assignments fetched');
    return;
  }

  sendError(res, 403, 'Insufficient permissions');
});

export const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const token = req.token as string;
  const { id } = req.params;

  if (user.role === 'student') {
    const result = await assignmentService.getStudentAssignmentById(id, token, tenant);
    sendSuccess(res, result, 'Assignment fetched');
    return;
  }

  if (user.role === 'teacher') {
    const result = await assignmentService.getTeacherAssignmentById(id, token, tenant);
    sendSuccess(res, result, 'Assignment fetched');
    return;
  }

  sendError(res, 403, 'Insufficient permissions');
});

export const submitAssignment = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const token = req.token as string;

  const file = req.file;
  if (!file) {
    sendError(res, 400, 'assignmentFile is required');
    return;
  }

  const { assignment_id, student_notes } = req.body as {
    assignment_id?: string;
    student_notes?: string;
  };

  if (!assignment_id) {
    sendError(res, 400, 'assignment_id is required');
    return;
  }

  const result = await assignmentService.submitAssignment(
    file,
    assignment_id,
    student_notes,
    token,
    tenant,
  );

  sendSuccess(res, result, 'Assignment submitted successfully');
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const token = req.token as string;
  const body = req.body as CreateAssignmentRequest;

  if (!body.title || !body.class_id || !body.subject_id || !body.due_date) {
    sendError(res, 400, 'title, class_id, subject_id and due_date are required');
    return;
  }

  const result = await assignmentService.createAssignment(body, req.file, token, tenant);

  sendSuccess(res, result, 'Assignment created successfully', 201);
});

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const token = req.token as string;
  const { submissionId } = req.params;
  const body = req.body as GradeSubmissionRequest;

  if (!body.grade || body.marks_obtained === undefined) {
    sendError(res, 400, 'grade and marks_obtained are required');
    return;
  }

  await assignmentService.gradeSubmission(submissionId, body, token, tenant);

  sendSuccess(res, null, 'Submission graded successfully');
});

export const getMetadata = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const token = req.token as string;

  const result = await assignmentService.getMetadata(token, tenant);

  sendSuccess(res, result, 'Metadata fetched');
});
