import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../api/modules/student.api';

export interface StudentProfile {
  name: string;
  rollNumber: string;
  email?: string;
  classId?: number;
}

export const useStudentProfile = (studentId: string) =>
  useQuery({
    queryKey: ['student', 'profile', studentId],
    queryFn: async (): Promise<StudentProfile | null> => {
      const results = await studentApi.search(studentId);
      const match = results.find((s) => s.student_id === studentId) ?? results[0];
      if (!match) return null;
      return {
        name: match.student_name || `${match.first_name ?? ''} ${match.last_name ?? ''}`.trim(),
        rollNumber: match.roll_number ?? '',
        email: match.email,
        classId: match.class_id,
      };
    },
    enabled: Boolean(studentId),
    staleTime: 60_000,
  });
