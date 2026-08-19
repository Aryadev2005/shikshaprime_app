import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/modules/attendance.api';
import { BulkMarkPayload } from '../types/attendance';

const ATTENDANCE_KEYS = {
  myRecords: (month?: number, year?: number) =>
    ['attendance', 'my-records', month, year] as const,
  classStudents: (classId: string) =>
    ['attendance', 'class-students', classId] as const,
  classSummary: (classId: string, date: string) =>
    ['attendance', 'summary', classId, date] as const,
};

export const useMyAttendance = (month?: number, year?: number) =>
  useQuery({
    queryKey: ATTENDANCE_KEYS.myRecords(month, year),
    queryFn: () => attendanceApi.getMyAttendance(month, year),
    staleTime: 300_000,
  });

export const useClassStudents = (classId: string) =>
  useQuery({
    queryKey: ATTENDANCE_KEYS.classStudents(classId),
    queryFn: () => attendanceApi.getClassStudents(classId),
    enabled: Boolean(classId),
    staleTime: 300_000,
  });

export const useClassSummary = (classId: string, date: string) =>
  useQuery({
    queryKey: ATTENDANCE_KEYS.classSummary(classId, date),
    queryFn: () => attendanceApi.getClassSummary(classId, date),
    enabled: Boolean(classId) && Boolean(date),
    staleTime: 300_000,
  });

export const useBulkMark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkMarkPayload) => attendanceApi.bulkMarkAttendance(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ATTENDANCE_KEYS.classSummary(variables.classInfo.class_id, variables.date),
      });
    },
  });
};
