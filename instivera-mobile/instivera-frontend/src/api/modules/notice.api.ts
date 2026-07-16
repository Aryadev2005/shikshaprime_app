import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';

export interface Notice {
  id: number;
  notice_id: string;
  title: string;
  content: string | null;
  published_date: string | null;
  expires_at: string | null;
  target_audience: 'ALL' | 'STUDENT' | 'TEACHER';
  is_active: number;
  created_by: string | null;
  attachment: string | null;
  institution_type: string | null;
  created_at: string;
}

export interface NoticeListResponse {
  notices: Notice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const client = apiClient.getClient();

export const noticeApi = {
  async getNotices(page = 1, pageSize = 20): Promise<NoticeListResponse> {
    const response = await client.get<ApiResponse<NoticeListResponse>>('/notices', {
      params: { page, pageSize },
    });
    return response.data.data;
  },

  async getNoticeById(id: string): Promise<Notice> {
    const response = await client.get<ApiResponse<Notice>>(`/notices/${id}`);
    return response.data.data;
  },
};
