import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { fileUrl } from '../../middleware/upload.middleware';
import { StudentAssignmentService } from './student-assignment.service';
import { TeacherAssignmentService } from './teacher-assignment.service';
import { TeacherService } from '../teacher/teacher.service';

// ── Student assignment handlers ───────────────────────────────────────────────
export const listMyAssignments = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code!;
  const result = await StudentAssignmentService.listMyAssignments(studentId, req.tenant!, req.query);
  sendSuccess(res, result);
});

export const getStudentAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const result = await StudentAssignmentService.getAssignmentById(
    Number(req.params.id), req.user!.user_code!, req.tenant!,
  );
  sendSuccess(res, result);
});

export const submitAssignment = asyncHandler(async (req: Request, res: Response) => {
  const url = fileUrl(req.file);
  const result = await StudentAssignmentService.submitAssignment(
    Number(req.params.id), req.user!.user_code!, req.body.submission_text, url, req.tenant!,
  );
  sendSuccess(res, result, 'Assignment submitted successfully');
});

// ── Teacher assignment handlers ───────────────────────────────────────────────
export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await TeacherService.resolveTeacherId(req.user!.user_code!, req.tenant!);
  const result = await TeacherAssignmentService.listAssignments(teacherId, req.tenant!, req.query);
  sendSuccess(res, result);
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await TeacherService.resolveTeacherId(req.user!.user_code!, req.tenant!);
  const result = await TeacherAssignmentService.createAssignment(teacherId, req.body, req.tenant!, req.file);
  sendSuccess(res, result, 'Assignment created', 201);
});

export const getTeacherAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await TeacherService.resolveTeacherId(req.user!.user_code!, req.tenant!);
  const result = await TeacherAssignmentService.getAssignmentById(Number(req.params.id), teacherId, req.tenant!);
  sendSuccess(res, result);
});

export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await TeacherService.resolveTeacherId(req.user!.user_code!, req.tenant!);
  const result = await TeacherAssignmentService.updateAssignment(Number(req.params.id), teacherId, req.body, req.tenant!, req.file);
  sendSuccess(res, result, 'Assignment updated');
});

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const result = await TeacherAssignmentService.gradeSubmission(Number(req.params.submissionId), req.body, req.tenant!);
  sendSuccess(res, result, 'Submission graded');
});

export const getSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await TeacherService.resolveTeacherId(req.user!.user_code!, req.tenant!);
  const result = await TeacherAssignmentService.getSubmissions(Number(req.params.id), teacherId, req.tenant!);
  sendSuccess(res, result);
});

export const getMetadata = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await TeacherService.resolveTeacherId(req.user!.user_code!, req.tenant!);
  const result = await TeacherAssignmentService.getMetadata(teacherId, req.tenant!);
  sendSuccess(res, result);
});
