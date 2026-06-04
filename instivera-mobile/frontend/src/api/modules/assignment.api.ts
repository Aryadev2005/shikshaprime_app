import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import {
  AssignmentListResponse,
  AssignmentDetail,
  SubmitAssignmentResult,
  AssignmentMetadata,
  GradeSubmissionPayload,
  CreateAssignmentPayload,
} from '../../types/assignment';

const client = apiClient.getClient();

export const assignmentApi = {
  async getAssignments(): Promise<AssignmentListResponse> {
    const response = await client.get<ApiResponse<AssignmentListResponse>>('/assignments');
    return response.data.data;
  },

  async getAssignmentById(id: string): Promise<AssignmentDetail> {
    const response = await client.get<ApiResponse<AssignmentDetail>>(`/assignments/${id}`);
    return response.data.data;
  },

  async submitAssignment(formData: FormData): Promise<SubmitAssignmentResult> {
    const response = await client.post<ApiResponse<SubmitAssignmentResult>>(
      '/assignments/submit',
      formData,
      {
        // React Native's native XHR sets the correct multipart boundary;
        // setting this header signals intent while the native layer handles the boundary.
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data.data;
  },

  async createAssignment(data: CreateAssignmentPayload): Promise<AssignmentDetail> {
    const response = await client.post<ApiResponse<AssignmentDetail>>('/assignments', data);
    return response.data.data;
  },

  async gradeSubmission(
    submissionId: string,
    data: GradeSubmissionPayload,
  ): Promise<void> {
    await client.put(`/assignments/grade/${submissionId}`, data);
  },

  async getAssignmentMetadata(): Promise<AssignmentMetadata> {
    const response = await client.get<ApiResponse<AssignmentMetadata>>('/assignments/metadata');
    return response.data.data;
  },
};
