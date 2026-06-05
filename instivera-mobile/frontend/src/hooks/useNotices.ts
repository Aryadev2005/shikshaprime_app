import { useQuery } from '@tanstack/react-query';
import { noticeApi } from '../api/modules/notice.api';

const NOTICE_KEYS = {
  list: (page: number) => ['notices', page] as const,
  detail: (id: string) => ['notice', id] as const,
};

export const useNoticeList = (page = 1) =>
  useQuery({
    queryKey: NOTICE_KEYS.list(page),
    queryFn: () => noticeApi.getNotices(page),
    staleTime: 120_000,
  });

export const useNoticeDetail = (id: string) =>
  useQuery({
    queryKey: NOTICE_KEYS.detail(id),
    queryFn: () => noticeApi.getNoticeById(id),
    enabled: Boolean(id),
    staleTime: 300_000,
  });
