import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';

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

const client = apiClient.getClient();

export const profileApi = {
  async getMyProfile(): Promise<ProfileData> {
    const response = await client.get<ApiResponse<ProfileData>>('/profile/me');
    return response.data.data;
  },
};
