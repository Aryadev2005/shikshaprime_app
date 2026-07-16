import { apiClient } from '../client';

export type TimetableTone = 'plum' | 'coral' | 'green' | 'amber';

export interface TimetableEvent {
  time: string;
  duration: string;
  subject: string;
  room: string;
  teacher: string;
  classId: string;
  tone: TimetableTone;
  isActive?: boolean;
  isDeadline?: boolean;
}

const client = apiClient.getClient();

export const timetableApi = {
  getTimetable: async (date?: string): Promise<TimetableEvent[]> => {
    const res = await client.get('/teacher/timetable', {
      params: date ? { date } : undefined,
    });
    return res.data?.data ?? res.data ?? [];
  },
};
