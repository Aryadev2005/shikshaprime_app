import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';

export interface Notice {
  id: number;
  title: string;
  /** Backend column is `description`. */
  content: string | null;
  /** Backend column is `from_date`. */
  published_date: string | null;
  /** Backend column is `to_date`. */
  expires_at: string | null;
  attachment: string | null;
  created_at: string;
  /**
   * Not stored on the tenant `notices` table today — identity-service never
   * populates these. Kept optional so the UI's conditional rendering simply
   * skips them. Tracked in INTEGRATION_LOG.md.
   */
  target_audience?: 'ALL' | 'STUDENT' | 'TEACHER';
  created_by?: string | null;
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

/** Row as identity-service returns it (models/tenant/Notice.ts). */
interface RawNotice {
  id: number;
  title: string;
  description: string | null;
  attachment: string | null;
  from_date: string | null;
  to_date: string | null;
  created_at: string;
  updated_at: string;
}

const client = apiClient.getClient();

const toNotice = (raw: RawNotice, attachmentUrl?: string | null): Notice => ({
  id: raw.id,
  title: raw.title,
  content: raw.description ?? null,
  published_date: raw.from_date ?? null,
  expires_at: raw.to_date ?? null,
  attachment: attachmentUrl ?? raw.attachment ?? null,
  created_at: raw.created_at,
});

export const noticeApi = {
  async getNotices(page = 1, pageSize = 20): Promise<NoticeListResponse> {
    // NoticeController.getAllNotices nests the rows one level deeper again:
    // { status, data: { data: rows, pagination: {...} } }
    const response = await client.get<
      ApiResponse<{
        data: RawNotice[];
        pagination: {
          currentPage: number;
          pageSize: number;
          totalRecords: number;
          totalPages: number;
        };
      }>
    >('/api/identity/notice/all', { params: { page, pageSize } });

    const body = response.data.data;
    const p = body?.pagination;

    return {
      notices: (body?.data ?? []).map((raw) => toNotice(raw)),
      pagination: {
        total: p?.totalRecords ?? 0,
        page: p?.currentPage ?? page,
        limit: p?.pageSize ?? pageSize,
        totalPages: p?.totalPages ?? 0,
      },
    };
  },

  async getNoticeById(id: string): Promise<Notice> {
    // getNoticeById returns { notice, document }, where `document` is the
    // attachment resolved to an absolute URL.
    const response = await client.get<
      ApiResponse<{ notice: RawNotice; document: string | null }>
    >(`/api/identity/notice/${id}`);

    const { notice, document } = response.data.data;
    return toNotice(notice, document);
  },
};
