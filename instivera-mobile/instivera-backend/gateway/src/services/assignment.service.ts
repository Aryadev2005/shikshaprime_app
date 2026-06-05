import FormData from 'form-data';
import { studentClient, teacherClient } from './clients';
import logger from '../utils/logger';
import { ApiError } from '../utils/api-error';
import {
  UpstreamStudentAssignmentStatsResponse,
  UpstreamAssignmentListResponse,
  UpstreamAssignmentDetailResponse,
  UpstreamSubmitResponse,
  UpstreamMetadataSubject,
  UpstreamMetadataClass,
  UpstreamMetadataResponse,
  MobileAssignmentList,
  MobileAssignmentDetail,
  MobileSubmitResult,
  MobileMetadata,
  GradeSubmissionRequest,
  CreateAssignmentRequest,
} from '../types/assignment.types';
import { toMobileAssignmentList, toMobileAssignmentDetail } from '../models/dto/assignment.dto';

export class AssignmentService {
  async getStudentAssignments(
    _studentId: string,
    token: string,
    tenant: string,
  ): Promise<MobileAssignmentList> {
    try {
      const response = await studentClient.request(token, tenant, {
        method: 'GET',
        url: '/assignments/stats',
      });

      const upstream = response.data as UpstreamStudentAssignmentStatsResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch assignments');
      }

      return toMobileAssignmentList(upstream.data, 'student');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error }, '[AssignmentService] getStudentAssignments error');
      throw new ApiError(502, 'Failed to fetch assignments');
    }
  }

  async getTeacherAssignments(token: string, tenant: string): Promise<MobileAssignmentList> {
    try {
      const response = await teacherClient.request(token, tenant, {
        method: 'GET',
        url: '/assignments',
      });

      const upstream = response.data as UpstreamAssignmentListResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch assignments');
      }

      return toMobileAssignmentList(upstream.data, 'teacher');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error }, '[AssignmentService] getTeacherAssignments error');
      throw new ApiError(502, 'Failed to fetch assignments');
    }
  }

  async getStudentAssignmentById(
    id: string,
    token: string,
    tenant: string,
  ): Promise<MobileAssignmentDetail> {
    try {
      const response = await studentClient.request(token, tenant, {
        method: 'GET',
        url: `/assignments/${id}`,
      });

      const upstream = response.data as UpstreamAssignmentDetailResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch assignment');
      }

      return toMobileAssignmentDetail(upstream.data);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, id }, '[AssignmentService] getStudentAssignmentById error');
      throw new ApiError(502, 'Failed to fetch assignment');
    }
  }

  async getTeacherAssignmentById(
    id: string,
    token: string,
    tenant: string,
  ): Promise<MobileAssignmentDetail> {
    try {
      const response = await teacherClient.request(token, tenant, {
        method: 'GET',
        url: `/assignments/${id}`,
      });

      const upstream = response.data as UpstreamAssignmentDetailResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch assignment');
      }

      return toMobileAssignmentDetail(upstream.data);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, id }, '[AssignmentService] getTeacherAssignmentById error');
      throw new ApiError(502, 'Failed to fetch assignment');
    }
  }

  async submitAssignment(
    file: Express.Multer.File,
    assignmentId: string,
    studentNotes: string | undefined,
    token: string,
    tenant: string,
  ): Promise<MobileSubmitResult> {
    const form = new FormData();
    form.append('assignmentFile', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      knownLength: file.size,
    });
    form.append('assignment_id', assignmentId);
    if (studentNotes) {
      form.append('student_notes', studentNotes);
    }

    try {
      const response = await studentClient.request(token, tenant, {
        method: 'POST',
        url: '/assignments/submit',
        data: form,
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const upstream = response.data as UpstreamSubmitResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to submit assignment');
      }

      return {
        submissionId: upstream.data.submission_id,
        assignmentId: upstream.data.assignment_id,
        submissionDate: upstream.data.submission_date,
        status: upstream.data.status,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, assignmentId }, '[AssignmentService] submitAssignment error');
      throw new ApiError(502, 'Failed to submit assignment');
    }
  }

  async createAssignment(
    body: CreateAssignmentRequest,
    file: Express.Multer.File | undefined,
    token: string,
    tenant: string,
  ): Promise<MobileAssignmentDetail> {
    let requestData: FormData | CreateAssignmentRequest;
    let extraHeaders: Record<string, string> = {};

    if (file) {
      const form = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined) form.append(key, String(value));
      });
      form.append('assignmentFile', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        knownLength: file.size,
      });
      requestData = form;
      extraHeaders = form.getHeaders() as Record<string, string>;
    } else {
      requestData = body;
    }

    try {
      const response = await teacherClient.request(token, tenant, {
        method: 'POST',
        url: '/assignments',
        data: requestData,
        headers: extraHeaders,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const upstream = response.data as UpstreamAssignmentDetailResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to create assignment');
      }

      return toMobileAssignmentDetail(upstream.data);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error }, '[AssignmentService] createAssignment error');
      throw new ApiError(502, 'Failed to create assignment');
    }
  }

  async gradeSubmission(
    submissionId: string,
    body: GradeSubmissionRequest,
    token: string,
    tenant: string,
  ): Promise<void> {
    try {
      const response = await teacherClient.request(token, tenant, {
        method: 'PUT',
        url: `/submissions/${submissionId}/grade`,
        data: body,
      });

      const upstream = response.data as { status: 1 | 0; message: string };
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to grade submission');
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, submissionId }, '[AssignmentService] gradeSubmission error');
      throw new ApiError(502, 'Failed to grade submission');
    }
  }

  async getMetadata(token: string, tenant: string): Promise<MobileMetadata> {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        teacherClient.request(token, tenant, {
          method: 'GET',
          url: '/metadata/subjects',
        }),
        teacherClient.request(token, tenant, {
          method: 'GET',
          url: '/metadata/classes',
        }),
      ]);

      const subjectsUpstream = subjectsRes.data as UpstreamMetadataResponse<UpstreamMetadataSubject>;
      const classesUpstream = classesRes.data as UpstreamMetadataResponse<UpstreamMetadataClass>;

      return {
        subjects: (subjectsUpstream.data ?? []).map((s) => ({ id: s.id, name: s.name })),
        classes: (classesUpstream.data ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          section: c.section,
        })),
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error }, '[AssignmentService] getMetadata error');
      throw new ApiError(502, 'Failed to fetch metadata');
    }
  }
}

export const assignmentService = new AssignmentService();
