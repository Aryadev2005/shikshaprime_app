import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TOKENS } from '../../theme/tokens';
import { Pill, Avatar } from '../../components/ui';
import { useTimetable } from '../../hooks/useTimetable';
import { TimetableEvent } from '../../api/modules/timetable.api';
import { CalendarStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CalendarStackParamList, 'Calendar'>;

// ─── Static timetable fallback ────────────────────────────────────────────────

type Tone = 'plum' | 'coral' | 'green' | 'amber';

const STATIC_SCHEDULE: TimetableEvent[] = [
  {
    time: '09:00',
    duration: '1h',
    subject: 'Mathematics',
    room: 'Room 204',
    teacher: 'John Doe',
    classId: 'CLS-1A',
    tone: 'plum',
    isActive: true,
  },
  {
    time: '10:30',
    duration: '1h 30m',
    subject: 'Physics Lab',
    room: 'Block C',
    teacher: 'S. Mehta',
    classId: 'CLS-2B',
    tone: 'coral',
  },
  {
    time: '13:00',
    duration: '1h',
    subject: 'English Lit',
    room: 'Room 109',
    teacher: 'P. Nair',
    classId: 'CLS-3A',
    tone: 'green',
  },
  {
    time: '16:00',
    duration: '—',
    subject: 'Essay Deadline',
    room: 'History · Submit',
    teacher: '',
    classId: '',
    tone: 'amber',
    isDeadline: true,
  },
];

// ─── Week strip helpers ───────────────────────────────────────────────────────

const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const toDateString = (d: Date): string =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');

// ─── Tone maps ────────────────────────────────────────────────────────────────

const TONE_BG: Record<Tone, string> = {
  plum: TOKENS.plumTint,
  coral: TOKENS.coralTint,
  green: TOKENS.greenTint,
  amber: TOKENS.amberTint,
};
const TONE_COLOR: Record<Tone, string> = {
  plum: TOKENS.plum,
  coral: TOKENS.coral,
  green: TOKENS.green,
  amber: TOKENS.amber,
};

// ─── Timeline row ─────────────────────────────────────────────────────────────

const TimeRow: React.FC<{
  event: TimetableEvent;
  isLast: boolean;
  onTakeAttendance: () => void;
}> = ({ event, isLast, onTakeAttendance }) => {
  const tone = (event.tone ?? 'plum') as Tone;
  const c = TONE_COLOR[tone];
  const bg = TONE_BG[tone];

  return (
    <View style={styles.timeRow}>
      {/* Time column */}
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{event.time}</Text>
        <Text style={styles.timeDuration}>{event.duration}</Text>
      </View>

      {/* Timeline dot + line */}
      <View style={styles.timelineCol}>
        {!isLast && <View style={styles.timelineLine} />}
        <View style={[styles.timelineDot, { backgroundColor: c }]} />
      </View>

      {/* Event card */}
      <View
        style={[
          styles.eventCard,
          event.isDeadline
            ? [styles.eventCardDeadline, { borderColor: TOKENS.amber }]
            : { backgroundColor: bg },
        ]}
      >
        <View style={styles.eventCardTop}>
          <Text style={styles.eventSubject}>{event.subject}</Text>
          {event.isActive && (
            <Pill tone="plum" dot>
              Live
            </Pill>
          )}
          {event.isDeadline && <Pill tone="amber">Deadline</Pill>}
        </View>
        {event.teacher ? (
          <Text style={styles.eventMeta}>
            {event.teacher} · {event.room}
          </Text>
        ) : (
          <Text style={styles.eventMeta}>{event.room}</Text>
        )}

        {!event.isDeadline && (
          <View style={styles.eventFooter}>
            {/* Overlapping avatars */}
            <View style={styles.avatarRow}>
              {['Karan V', 'Tara I', 'Riya M'].map((n, i) => (
                <View key={i} style={[styles.avatarWrap, { marginLeft: i === 0 ? 0 : -7 }]}>
                  <Avatar name={n} size={22} ring />
                </View>
              ))}
              <View style={[styles.avatarOverflow, { marginLeft: -7, backgroundColor: '#fff', borderColor: bg }]}>
                <Text style={styles.avatarOverflowText}>+39</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.attendanceBtn, { backgroundColor: c }]}
              onPress={onTakeAttendance}
              activeOpacity={0.8}
            >
              <Text style={styles.attendanceBtnText}>Take attendance</Text>
              <MaterialCommunityIcons name="arrow-right" size={11} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const monday = getMondayOfWeek(selectedDate);

  const dateStr = toDateString(selectedDate);
  const { data: apiEvents } = useTimetable(dateStr);
  const events: TimetableEvent[] =
    apiEvents && apiEvents.length > 0 ? apiEvents : STATIC_SCHEDULE;

  // Build week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();

  const selectedLabel = selectedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const goToPrevWeek = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const monthLabel = monday.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const handleTakeAttendance = (event: TimetableEvent) => {
    if (!event.classId) return;
    navigation.navigate('AttendanceTaker', {
      classId: event.classId,
      date: dateStr,
      className: event.subject,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSuper}>{monthLabel}</Text>
          <Text style={styles.headerTitle}>This week</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => setSelectedDate(today)}
          >
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addFAB}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        <TouchableOpacity onPress={goToPrevWeek} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={TOKENS.ink3} />
        </TouchableOpacity>
        <View style={styles.weekDays}>
          {weekDays.map((d, i) => {
            const selected = isSelected(d);
            const todayDay = isToday(d);
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayCell, selected && styles.dayCellSelected]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayAbbr, selected && styles.dayAbbrSelected]}>
                  {DAY_ABBRS[i]}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    selected && styles.dayNumSelected,
                    todayDay && !selected && { color: TOKENS.coral },
                  ]}
                >
                  {d.getDate()}
                </Text>
                <View style={styles.dayDots}>
                  {i < 5 &&
                    Array.from({ length: Math.min(i % 3 + 1, 3) }).map((_, j) => (
                      <View
                        key={j}
                        style={[
                          styles.dayDot,
                          { backgroundColor: selected ? '#fff' : TOKENS.coral },
                        ]}
                      />
                    ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity onPress={goToNextWeek} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={TOKENS.ink3} />
        </TouchableOpacity>
      </View>

      {/* Day header */}
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayHeaderDate}>{selectedLabel}</Text>
          <Text style={styles.dayHeaderSub}>
            {events.filter((e) => !e.isDeadline).length} classes ·{' '}
            {events.filter((e) => e.isDeadline).length} deadline
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <ScrollView
        contentContainerStyle={styles.timeline}
        showsVerticalScrollIndicator={false}
      >
        {events.map((event, i) => (
          <TimeRow
            key={i}
            event={event}
            isLast={i === events.length - 1}
            onTakeAttendance={() => handleTakeAttendance(event)}
          />
        ))}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerSuper: { fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.4, textTransform: 'uppercase' },
  headerTitle: {
    fontFamily: 'InstrumentSerif',
    fontSize: 30,
    color: TOKENS.ink,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginTop: 4,
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TOKENS.line,
  },
  todayBtnText: { fontSize: 12, fontWeight: '600', color: TOKENS.ink2 },
  addFAB: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekStrip: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.line,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekDays: { flex: 1, flexDirection: 'row' },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  dayCellSelected: { backgroundColor: TOKENS.plum },
  dayAbbr: {
    fontSize: 10,
    color: TOKENS.ink3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dayAbbrSelected: { color: 'rgba(255,255,255,0.7)' },
  dayNum: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: TOKENS.ink },
  dayNumSelected: { color: '#fff' },
  dayDots: { flexDirection: 'row', gap: 2, marginTop: 4, height: 4 },
  dayDot: { width: 3, height: 3, borderRadius: 1.5 },

  dayHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  dayHeaderDate: { fontSize: 16, fontWeight: '700', color: TOKENS.ink, letterSpacing: -0.2 },
  dayHeaderSub: { fontSize: 12, color: TOKENS.ink3, marginTop: 2 },

  timeline: { paddingHorizontal: 20, paddingTop: 14 },

  timeRow: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  timeCol: { width: 52, flexShrink: 0, paddingTop: 4 },
  timeText: { fontSize: 13, fontWeight: '700', color: TOKENS.ink, letterSpacing: -0.2 },
  timeDuration: { fontSize: 10.5, color: TOKENS.ink3, marginTop: 1 },

  timelineCol: { width: 4, flexShrink: 0, position: 'relative' },
  timelineLine: {
    position: 'absolute',
    top: 4,
    bottom: -14,
    left: 1,
    width: 2,
    backgroundColor: TOKENS.line,
    borderRadius: 1,
  },
  timelineDot: {
    position: 'absolute',
    top: 6,
    left: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  eventCard: {
    flex: 1,
    padding: 13,
    borderRadius: 14,
    marginBottom: 4,
  },
  eventCardDeadline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  eventCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventSubject: { fontSize: 15, fontWeight: '600', color: TOKENS.ink, letterSpacing: -0.2 },
  eventMeta: { fontSize: 11.5, color: TOKENS.ink3, marginTop: 3 },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {},
  avatarOverflow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverflowText: { fontSize: 9.5, fontWeight: '700', color: TOKENS.ink2 },
  attendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  attendanceBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' },
});
