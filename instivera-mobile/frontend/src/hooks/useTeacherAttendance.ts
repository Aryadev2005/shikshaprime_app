import { useQuery } from '@tanstack/react-query';
import { teacherAttendanceApi } from '../api/modules/teacherAttendance.api';

export const useMyTeacherAttendance = (month: number, year: number) =>
  useQuery({
    queryKey: ['teacher-attendance', month, year],
    queryFn: () => teacherAttendanceApi.getMyAttendance(month, year),
    staleTime: 300_000,
  });
