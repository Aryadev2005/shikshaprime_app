import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';

export interface StudentSearchResult {
  id: number;
  student_id: string;
  student_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  roll_number?: string;
  class_id?: number;
}

const client = apiClient.getClient();

export const studentApi = {
  async search(query: string): Promise<StudentSearchResult[]> {
    // searchStudents reads `query`, not `q` (studentController.ts:376).
    const response = await client.get<ApiResponse<StudentSearchResult[]>>(
      '/api/student/search',
      { params: { query } },
    );
    return response.data.data;
  },
};
