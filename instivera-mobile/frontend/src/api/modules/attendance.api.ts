import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import {
  MyAttendanceResponse,
  ClassStudentsResponse,
  ClassSummaryResponse,
  BulkMarkPayload,
  BulkMarkResult,
} from '../../types/attendance';

const client = apiClient.getClient();

export const attendanceApi = {
  async getMyAttendance(month?: number, year?: number): Promise<MyAttendanceResponse> {
    const params: Record<string, number> = {};
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;

    const response = await client.get<ApiResponse<MyAttendanceResponse>>(
      '/attendance/my-records',
      { params },
    );
    return response.data.data;
  },

  async getClassStudents(classId: string): Promise<ClassStudentsResponse> {
    const response = await client.get<ApiResponse<ClassStudentsResponse>>(
      '/attendance/class-students',
      { params: { class_id: classId } },
    );
    return response.data.data;
  },

  async getClassSummary(classId: string, date: string): Promise<ClassSummaryResponse> {
    const response = await client.get<ApiResponse<ClassSummaryResponse>>(
      '/attendance/summary',
      { params: { class_id: classId, date } },
    );
    return response.data.data;
  },

  async bulkMarkAttendance(payload: BulkMarkPayload): Promise<BulkMarkResult> {
    const response = await client.post<ApiResponse<BulkMarkResult>>(
      '/attendance/bulk-mark',
      payload,
    );
    return response.data.data;
  },
};
