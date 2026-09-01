import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import { useAuthStore } from '../../store/authStore';

export interface ProfileData {
  type: 'teacher' | 'student';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_picture?: string;
  // teacher-only
  employee_id?: string;
  department_id?: number;
  designation?: string;
  // student-only
  roll_number?: string;
  class_id?: number;
  program_id?: number;
}

/** `GET /api/student/me` returns the raw profile bundle (studentService.ts). */
interface RawStudentBundle {
  student_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  roll_number?: string | null;
  class_id?: number | null;
  program_id?: number | null;
  profile_img?: string | null;
}

/** `GET /api/teacher/faculty/me/profile` returns the profile-page payload. */
interface RawTeacherProfilePage {
  teacher?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    employee_id?: string | null;
    department_id?: number | null;
    designation?: string | null;
  } | null;
}

const client = apiClient.getClient();

const isStudent = (): boolean => useAuthStore.getState().role === 'student';

/**
 * The student bundle only exposes a pre-concatenated `student_name`
 * (first + middle + last), so first/last are recovered by splitting it.
 */
const splitName = (full?: string | null): { first: string; last: string } => {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
};

export const profileApi = {
  // There is no unified /profile/me on the backend — the student and teacher
  // profiles live in different services with different payloads, so this
  // branches on the caller's role and normalises both into ProfileData.
  async getMyProfile(): Promise<ProfileData> {
    if (isStudent()) {
      const response = await client.get<ApiResponse<RawStudentBundle>>(
        '/api/student/me',
      );
      const b = response.data.data ?? {};
      const { first, last } = splitName(b.student_name);

      return {
        type: 'student',
        first_name: first,
        last_name: last,
        email: b.email ?? '',
        phone: b.mobile ?? '',
        profile_picture: b.profile_img ?? undefined,
        roll_number: b.roll_number ?? undefined,
        class_id: b.class_id ?? undefined,
        program_id: b.program_id ?? undefined,
      };
    }

    const response = await client.get<ApiResponse<RawTeacherProfilePage>>(
      '/api/teacher/faculty/me/profile',
    );
    const t = response.data.data?.teacher ?? {};

    return {
      type: 'teacher',
      first_name: t.first_name ?? '',
      last_name: t.last_name ?? '',
      email: t.email ?? '',
      phone: t.phone ?? '',
      // The `teachers` table has no profile-image column.
      employee_id: t.employee_id ?? undefined,
      department_id: t.department_id ?? undefined,
      designation: t.designation ?? undefined,
    };
  },
};
