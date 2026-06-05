import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useMyTeacherAttendance } from '../../hooks/useTeacherAttendance';
import {
  StaffAttendanceStatus,
  TeacherAttendanceRecord,
} from '../../api/modules/teacherAttendance.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PAD = 20;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - H_PAD * 2) / 7);

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Status → cell appearance ─────────────────────────────────────────────────

interface CellAppearance {
  bg: string;
  text: string;
  border?: string;
  filled: boolean;
}

const statusAppearance = (
  status: StaffAttendanceStatus | undefined,
  isToday: boolean,
  isFuture: boolean,
  isWeekend: boolean,
): CellAppearance => {
  if (status === 'PRESENT' || status === 'ON_DUTY') {
    return { bg: TOKENS.green, text: '#fff', filled: true };
  }
  if (status === 'ABSENT' || status === 'LEAVE') {
    return { bg: TOKENS.red, text: '#fff', filled: true };
  }
  if (status === 'LATE') {
    return { bg: TOKENS.amber, text: '#fff', filled: true };
  }
  if (status === 'HALF_DAY') {
    return { bg: 'transparent', text: TOKENS.amber, border: TOKENS.amber, filled: false };
  }
  if (status === 'HOLIDAY') {
    return { bg: TOKENS.blue, text: '#fff', filled: true };
  }
  if (isToday) {
    return { bg: 'transparent', text: TOKENS.plum, border: TOKENS.plum, filled: false };
  }
  // future or weekend or unmarked past
  return { bg: TOKENS.line2, text: isFuture || isWeekend ? TOKENS.ink4 : TOKENS.ink3, filled: true };
};

// ─── Day cell ─────────────────────────────────────────────────────────────────

const DayCell: React.FC<{
  day: number;
  appearance: CellAppearance;
}> = ({ day, appearance }) => (
  <View
    style={[
      cellStyles.circle,
      {
        width: CELL_SIZE - 6,
        height: CELL_SIZE - 6,
        backgroundColor: appearance.bg,
        borderColor: appearance.border ?? 'transparent',
        borderWidth: appearance.border ? 2 : 0,
      },
    ]}
  >
    <Text style={[cellStyles.dayText, { color: appearance.text }]}>{day}</Text>
  </View>
);

const EmptyCell: React.FC = () => (
  <View style={{ width: CELL_SIZE, height: CELL_SIZE }} />
);

const cellStyles = StyleSheet.create({
  circle: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  dayText: { fontSize: 13, fontWeight: '600' },
});

// ─── Calendar grid ────────────────────────────────────────────────────────────

const CalendarGrid: React.FC<{
  month: number;
  year: number;
  records: TeacherAttendanceRecord[];
}> = ({ month, year, records }) => {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();

  const recordMap = useMemo(() => {
    const map: Record<string, StaffAttendanceStatus> = {};
    for (const r of records) {
      map[r.attendance_date] = r.attendance_status;
    }
    return map;
  }, [records]);

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build flat cell array: nulls for leading empties, then day numbers
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad trailing to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  // Chunk into rows of 7
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View>
      {/* Day-of-week header */}
      <View style={gridStyles.row}>
        {DOW_LABELS.map((d) => (
          <View key={d} style={[gridStyles.headerCell, { width: CELL_SIZE }]}>
            <Text style={gridStyles.headerText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day rows */}
      {rows.map((row, ri) => (
        <View key={ri} style={gridStyles.row}>
          {row.map((day, di) => {
            if (day === null) return <EmptyCell key={di} />;

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const status = recordMap[dateStr];

            const isToday = year === todayY && month === todayM && day === todayD;
            const cellDate = new Date(year, month - 1, day);
            const isFuture = cellDate > new Date(todayY, todayM - 1, todayD);
            const dow = cellDate.getDay();
            const isWeekend = dow === 0 || dow === 6;

            const appearance = statusAppearance(status, isToday, isFuture, isWeekend);

            return (
              <View key={di} style={{ width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                <DayCell day={day} appearance={appearance} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const gridStyles = StyleSheet.create({
  row: { flexDirection: 'row' },
  headerCell: { alignItems: 'center', paddingBottom: 6 },
  headerText: { fontSize: 11, fontWeight: '700', color: TOKENS.ink3 },
});

// ─── Summary metric card ──────────────────────────────────────────────────────

const MetricCard: React.FC<{
  value: string;
  label: string;
  color: string;
}> = ({ value, label, color }) => (
  <View style={[metricStyles.card, { borderTopColor: color }]}>
    <Text style={[metricStyles.value, { color }]}>{value}</Text>
    <Text style={metricStyles.label}>{label}</Text>
  </View>
);

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderTopWidth: 3,
    padding: 10,
    alignItems: 'center',
  },
  value: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '600', color: TOKENS.ink3, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ─── Legend item ──────────────────────────────────────────────────────────────

const LegendItem: React.FC<{ color: string; label: string; outlined?: boolean }> = ({
  color, label, outlined,
}) => (
  <View style={legendStyles.item}>
    <View
      style={[
        legendStyles.dot,
        outlined
          ? { backgroundColor: 'transparent', borderColor: color, borderWidth: 2 }
          : { backgroundColor: color },
      ]}
    />
    <Text style={legendStyles.text}>{label}</Text>
  </View>
);

const legendStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { fontSize: 10, color: TOKENS.ink3 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export const TeacherAttendanceCalendarScreen: React.FC<{
  navigation: { goBack: () => void };
}> = ({ navigation }) => {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const { data, isLoading, isError, refetch } = useMyTeacherAttendance(viewMonth, viewYear);

  const goToPrev = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const summary = data?.summary;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrev} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={TOKENS.ink} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </Text>
          <TouchableOpacity onPress={goToNext} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={TOKENS.ink} />
          </TouchableOpacity>
        </View>

        {/* Loading / error / calendar */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={TOKENS.plum} />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Failed to load attendance</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Calendar card */}
            <View style={styles.card}>
              <CalendarGrid
                month={viewMonth}
                year={viewYear}
                records={data?.records ?? []}
              />

              {/* Legend */}
              <View style={styles.legend}>
                <LegendItem color={TOKENS.green} label="Present" />
                <LegendItem color={TOKENS.red} label="Absent" />
                <LegendItem color={TOKENS.amber} label="Late" />
                <LegendItem color={TOKENS.amber} label="Half Day" outlined />
                <LegendItem color={TOKENS.plum} label="Today" outlined />
              </View>
            </View>

            {/* Summary row */}
            {summary && (
              <View style={styles.metricsRow}>
                <MetricCard
                  value={String(summary.present)}
                  label="Present"
                  color={TOKENS.green}
                />
                <MetricCard
                  value={String(summary.absent)}
                  label="Absent"
                  color={TOKENS.red}
                />
                <MetricCard
                  value={String(summary.late)}
                  label="Late"
                  color={TOKENS.amber}
                />
                <MetricCard
                  value={`${summary.percentage}%`}
                  label="Rate"
                  color={TOKENS.plum}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  content: { paddingBottom: 60 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line,
    backgroundColor: TOKENS.paper,
  },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: TOKENS.ink },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: 'InstrumentSerif',
    fontSize: 22,
    color: TOKENS.ink,
    letterSpacing: -0.3,
  },

  centered: { paddingVertical: 60, alignItems: 'center' },
  errorText: { fontSize: 15, color: TOKENS.ink3, marginBottom: 14 },
  retryBtn: {
    backgroundColor: TOKENS.plum,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: TOKENS.paper, fontWeight: '600' },

  card: {
    marginHorizontal: H_PAD,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 14,
    marginBottom: 16,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: TOKENS.line2,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: H_PAD,
  },
});
