import { useQuery } from '@tanstack/react-query';
import { timetableApi, TimetableEvent } from '../api/modules/timetable.api';

export const useTimetable = (date?: string) =>
  useQuery<TimetableEvent[]>({
    queryKey: ['timetable', date ?? 'default'],
    queryFn: () => timetableApi.getTimetable(date),
    staleTime: 5 * 60_000,
  });
