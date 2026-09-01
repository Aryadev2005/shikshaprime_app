import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import { useAuthStore } from '../../store/authStore';

export type TimetableTone = 'plum' | 'coral' | 'green' | 'amber';

export interface TimetableEvent {
  time: string;
  duration: string;
  subject: string;
  /**
   * Secondary meta line. The class-routine tables have no room/venue column,
   * so this carries the class name (teacher view) or the teacher's name is
   * used instead (student view). Tracked in INTEGRATION_LOG.md.
   */
  room?: string;
  teacher?: string;
  classId: string;
  tone: TimetableTone;
  isActive?: boolean;
  isDeadline?: boolean;
}

/** One `class_routine_entries` row, as both routine endpoints return it. */
interface RawEntry {
  id: number;
  day_of_week: string;
  period_number: number;
  start_time: string | null;
  end_time: string | null;
  is_break: number | boolean;
  subject: { id: number; name: string | null; code: string | null } | null;
  teacher?: { first_name: string | null; last_name: string | null } | null;
  class?: { id: number; name: string | null; code: string | null } | null;
}

/** Student endpoint returns a whole routine (or null), not a flat list. */
interface RawRoutine {
  class?: { id: number; name: string | null; code: string | null } | null;
  entries?: RawEntry[];
}

const client = apiClient.getClient();

const isStudent = (): boolean => useAuthStore.getState().role === 'student';

const TONES: TimetableTone[] = ['plum', 'coral', 'green', 'amber'];

/** "09:30:00" -> "09:30". */
const toClock = (t: string | null): string => (t ? t.slice(0, 5) : '');

const toMinutes = (t: string | null): number | null => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

const toDuration = (start: string | null, end: string | null): string => {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a == null || b == null || b <= a) return '';
  const mins = b - a;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
};

/**
 * `day_of_week` is a free-text STRING(50) column with no enum or seed data in
 * this repo, so the stored casing is unverifiable from source alone. Full
 * English weekday names are the assumption — confirm against
 * /api/identity/class-routines/meta-data (see INTEGRATION_LOG.md Phase 3).
 */
const dayOfWeekFor = (date?: string): string | undefined => {
  if (!date) return undefined;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

const isSameDay = (date?: string): boolean => {
  if (!date) return true;
  const now = new Date();
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  return local === date;
};

const toEvent = (
  raw: RawEntry,
  index: number,
  opts: { studentView: boolean; today: boolean; fallbackClass?: string | null },
): TimetableEvent => {
  const start = toClock(raw.start_time);
  const teacherName = [raw.teacher?.first_name, raw.teacher?.last_name]
    .filter(Boolean)
    .join(' ');
  const className = raw.class?.name ?? opts.fallbackClass ?? '';

  const startMins = toMinutes(raw.start_time);
  const endMins = toMinutes(raw.end_time);
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

  return {
    time: start,
    duration: toDuration(raw.start_time, raw.end_time),
    subject: raw.is_break ? 'Break' : raw.subject?.name ?? 'Unassigned',
    // Student sees who teaches; teacher sees which class. No room column exists.
    teacher: opts.studentView ? teacherName : undefined,
    room: opts.studentView ? undefined : className,
    classId: raw.class?.id != null ? String(raw.class.id) : '',
    tone: TONES[index % TONES.length],
    isActive:
      opts.today && startMins != null && endMins != null
        ? nowMins >= startMins && nowMins < endMins
        : false,
  };
};

export const timetableApi = {
  getTimetable: async (date?: string): Promise<TimetableEvent[]> => {
    const studentView = isStudent();
    const today = isSameDay(date);

    if (studentView) {
      // getStudentRoutine resolves the caller's class itself and returns the
      // whole routine — or null when no ACTIVE routine exists for the class.
      const res = await client.get<ApiResponse<RawRoutine | null>>(
        '/api/identity/class-routines/student-schedule',
      );
      const routine = res.data?.data;
      if (!routine?.entries?.length) return [];

      const day = dayOfWeekFor(date);
      const entries = day
        ? routine.entries.filter(
            (e) => e.day_of_week?.toLowerCase() === day.toLowerCase(),
          )
        : routine.entries;

      return entries.map((e, i) =>
        toEvent(e, i, { studentView, today, fallbackClass: routine.class?.name }),
      );
    }

    const res = await client.get<ApiResponse<RawEntry[]>>(
      '/api/identity/class-routines/teacher-schedule',
      { params: { day_of_week: dayOfWeekFor(date) } },
    );
    return (res.data?.data ?? []).map((e, i) => toEvent(e, i, { studentView, today }));
  },
};
