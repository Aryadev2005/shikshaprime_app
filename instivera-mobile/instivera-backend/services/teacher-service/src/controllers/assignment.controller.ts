import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';
import { fileUrl } from '../middleware/upload.middleware';

const assignmentService = new AssignmentService();

const resolveEmployeeId = (user: any): string | undefined =>
  user?.employee_id || user?.user_code || user?.username;

export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const { class_id, subject_id, due_date } = req.query;

  const employeeId = resolveEmployeeId(user);
  if (!employeeId) return sendError(res, 400, 'Could not resolve employee ID from token');

  const filters: any = {};
  if (class_id) filters.class_id = Number(class_id);
  if (subject_id) filters.subject_id = Number(subject_id);
  if (due_date) filters.due_date = due_date as string;

  const assignments = await assignmentService.listAssignments(employeeId, filters, tenant);
  sendSuccess(res, assignments, 'Assignments retrieved successfully');
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const body = req.body;

  const employeeId = resolveEmployeeId(user);
  if (!employeeId) return sendError(res, 400, 'Could not resolve employee ID from token');
  if (!body.title) return sendError(res, 400, 'title is required');
  if (!body.class_id) return sendError(res, 400, 'class_id is required');

  const assignment = await assignmentService.createAssignment(
    {
      title: body.title,
      description: body.description,
      class_id: Number(body.class_id),
      subject_id: body.subject_id ? Number(body.subject_id) : undefined,
      due_date: body.due_date,
      allow_late_submissions: body.allow_late_submissions === 'true' || body.allow_late_submissions === true,
      detailed_instructions: body.detailed_instructions,
      type: body.type,
      maximum_marks: body.maximum_marks ? Number(body.maximum_marks) : undefined,
    },
    employeeId,
    fileUrl(req.file),
    tenant
  );

  sendSuccess(res, assignment, 'Assignment created successfully');
});

export const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { id } = req.params;

  const assignment = await assignmentService.getAssignmentById(id, tenant);
  sendSuccess(res, assignment, 'Assignment retrieved successfully');
});

export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { id } = req.params;
  const body = req.body;

  const assignment = await assignmentService.updateAssignment(
    id,
    {
      title: body.title,
      description: body.description,
      due_date: body.due_date,
      allow_late_submissions:
        body.allow_late_submissions === 'true' || body.allow_late_submissions === true,
      detailed_instructions: body.detailed_instructions,
      type: body.type,
      maximum_marks: body.maximum_marks ? Number(body.maximum_marks) : undefined,
    },
    fileUrl(req.file),
    tenant
  );

  sendSuccess(res, assignment, 'Assignment updated successfully');
});

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { submissionId } = req.params;
  const { grade, marks_obtained, feedback } = req.body;

  if (!grade && marks_obtained === undefined) {
    return sendError(res, 400, 'grade or marks_obtained is required');
  }

  const result = await assignmentService.gradeSubmission(
    submissionId,
    grade || '',
    Number(marks_obtained || 0),
    feedback,
    tenant
  );

  sendSuccess(res, result, 'Submission graded successfully');
});

export const getSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { id } = req.params;

  const submissions = await assignmentService.getSubmissionsForAssignment(id, tenant);
  sendSuccess(res, submissions, 'Submissions retrieved successfully');
});

export const getMetadata = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;

  const employeeId = resolveEmployeeId(user);
  if (!employeeId) return sendError(res, 400, 'Could not resolve employee ID from token');

  const metadata = await assignmentService.getMetadata(employeeId, tenant);
  sendSuccess(res, metadata, 'Metadata retrieved successfully');
});
