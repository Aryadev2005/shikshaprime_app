import Constants from 'expo-constants';
import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import { RepositoryCategory, RepositoryFile } from '../../types/repository';
import { useAuthStore } from '../../store/authStore';

const client = apiClient.getClient();
const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000/api/mobile';

export const repositoryApi = {
  async getCategories(): Promise<RepositoryCategory[]> {
    const response = await client.get<ApiResponse<RepositoryCategory[]>>(
      '/repository/categories',
    );
    return response.data.data;
  },

  async getFilesByCategory(categoryId: string): Promise<RepositoryFile[]> {
    const response = await client.get<ApiResponse<RepositoryFile[]>>(
      `/repository/categories/${categoryId}/files`,
    );
    return response.data.data;
  },

  // Returns a URL that includes auth credentials as query params so it can be
  // opened with Linking.openURL (browsers cannot set Authorization headers).
  getDownloadUrl(fileId: string): string {
    const { token, tenant } = useAuthStore.getState();
    const t = encodeURIComponent(token ?? '');
    const tn = encodeURIComponent(tenant ?? '');
    return `${BASE_URL}/repository/files/${fileId}/download?token=${t}&tenant=${tn}`;
  },
};
