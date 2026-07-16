import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';

export interface Institution {
  id: number;
  name: string;
  slug: string;
  type: 'school' | 'college';
  logo_url: string | null;
}

const client = apiClient.getClient();

export const institutionsApi = {
  async getInstitutions(): Promise<Institution[]> {
    const response = await client.get<ApiResponse<Institution[]>>('/institutions');
    return response.data.data;
  },
};
