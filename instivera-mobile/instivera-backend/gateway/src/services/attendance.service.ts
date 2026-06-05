import { studentClient } from './clients';

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
import logger from '../utils/logger';
import { ApiError } from '../utils/api-error';
import {
  UpstreamMyRecordsResponse,
  UpstreamClassSummaryResponse,
  UpstreamByClassResponse,
  UpstreamBulkMarkResponse,
  MobileAttendancePage,
  MobileClassSummary,
  MobileClassStudents,
  BulkMarkRequest,
  BulkMarkResult,
} from '../types/attendance.types';
import {
  toStudentAttendanceDTO,
  toClassSummaryDTO,
  toClassStudentsDTO,
} from '../models/dto/attendance.dto';

export class AttendanceService {
  async getMyRecords(
    studentId: string,
    token: string,
    tenant: string,
  ): Promise<MobileAttendancePage> {
    const today = new Date();
    // Heatmap always covers April 1 of current year → today
    const heatmapStart = new Date(today.getFullYear(), 3, 1);
    const startStr = formatLocalDate(heatmapStart);
    const endStr = formatLocalDate(today);

    try {
      const response = await studentClient.request(token, tenant, {
        method: 'GET',
        url: '/attendance/my-records',
        params: { studentId, startDate: startStr, endDate: endStr },
      });

      const upstream = response.data as UpstreamMyRecordsResponse;

      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch attendance records');
      }

      return toStudentAttendanceDTO(
        upstream.data.records,
        upstream.data.summary,
        heatmapStart,
        today,
      );
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, studentId }, '[AttendanceService] getMyRecords error');
      throw new ApiError(502, 'Failed to fetch attendance records');
    }
  }

  async getClassSummary(
    classId: string,
    date: string,
    token: string,
    tenant: string,
  ): Promise<MobileClassSummary> {
    try {
      const response = await studentClient.request(token, tenant, {
        method: 'GET',
        url: '/attendance/summary',
        params: { class_id: classId, date },
      });

      const upstream = response.data as UpstreamClassSummaryResponse;

      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch class summary');
      }

      return toClassSummaryDTO(upstream.data);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, classId }, '[AttendanceService] getClassSummary error');
      throw new ApiError(502, 'Failed to fetch class summary');
    }
  }

  async getClassStudents(
    classId: string,
    token: string,
    tenant: string,
  ): Promise<MobileClassStudents> {
    try {
      const response = await studentClient.request(token, tenant, {
        method: 'GET',
        url: '/students/by-class',
        params: { class_id: classId },
      });

      const upstream = response.data as UpstreamByClassResponse;

      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch class students');
      }

      return toClassStudentsDTO(upstream.data);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, classId }, '[AttendanceService] getClassStudents error');
      throw new ApiError(502, 'Failed to fetch class students');
    }
  }

  async bulkMark(
    body: BulkMarkRequest,
    markedBy: string,
    token: string,
    tenant: string,
  ): Promise<BulkMarkResult> {
    const students = body.students.map((s) => ({
      student_id: s.student_id,
      student_code: s.student_code,
      student_name: s.student_name,
      // LATE maps to PRESENT for upstream — late tracking is mobile-only
      attendance_status: s.status === 'LATE' ? 'PRESENT' : s.status,
    }));

    try {
      const response = await studentClient.request(token, tenant, {
        method: 'POST',
        url: '/attendance/bulk',
        data: { students, date: body.date, marked_by: markedBy },
      });

      const upstream = response.data as UpstreamBulkMarkResponse;

      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to mark attendance');
      }

      return { markedCount: upstream.data.count, date: body.date };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, markedBy }, '[AttendanceService] bulkMark error');
      throw new ApiError(502, 'Failed to mark attendance');
    }
  }
}

export const attendanceService = new AttendanceService();
