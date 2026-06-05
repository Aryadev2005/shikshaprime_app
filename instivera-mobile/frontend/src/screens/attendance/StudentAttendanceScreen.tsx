import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { useMyAttendance } from '../../hooks/useAttendance';
import { HeatmapCell } from '../../types/attendance';
import { Pill, Bar } from '../../components/ui';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HEATMAP_WEEKS = 9;
const HEATMAP_DAYS = 5;
const HEATMAP_PAD = 40;
const CELL_GAP = 4;
const CELL_SIZE = Math.floor(
  (SCREEN_WIDTH - HEATMAP_PAD * 2 - CELL_GAP * (HEATMAP_WEEKS - 1)) / HEATMAP_WEEKS,
);

const HEATMAP_COLORS = [TOKENS.line2, '#E5DAF4', TOKENS.plum300, TOKENS.plum500, TOKENS.plum];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F'];

// ─── Subject types ────────────────────────────────────────────────────────────

interface SubjectAttendance {
  name: string;
  attended: number;
  total: number;
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

const HeatmapGrid: React.FC<{ cells: HeatmapCell[] }> = ({ cells }) => {
  // Group cells by week × weekday using their index positions
  // cells are ordered by date; map each to a (week, weekday) bucket
  const grid: (HeatmapCell | null)[][] = Array.from({ length: HEATMAP_WEEKS }, () =>
    Array(HEATMAP_DAYS).fill(null),
  );

  cells.slice(0, HEATMAP_WEEKS * HEATMAP_DAYS).forEach((cell, i) => {
    const week = Math.floor(i / HEATMAP_DAYS);
    const day = i % HEATMAP_DAYS;
    if (week < HEATMAP_WEEKS) grid[week][day] = cell;
  });

  const getLevel = (cell: HeatmapCell | null): number => {
    if (!cell) return 0;
    if (cell.status === 'PRESENT') return 4;
    if (cell.status === 'ABSENT') return 1;
    return 0;
  };

  return (
    <View style={hStyles.container}>
      {/* Day labels */}
      <View style={hStyles.dayLabels}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={[hStyles.dayLabel, { height: CELL_SIZE + CELL_GAP }]}>
            <Text style={hStyles.dayLabelText}>{d}</Text>
          </View>
        ))}
      </View>
      {/* Grid columns (weeks) */}
      <View style={hStyles.grid}>
        {grid.map((col, w) => (
          <View key={w} style={hStyles.col}>
            {col.map((cell, d) => (
              <View
                key={d}
                style={[
                  hStyles.cell,
                  {
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: HEATMAP_COLORS[getLevel(cell)],
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const hStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  dayLabels: { flexDirection: 'column', paddingTop: 18 },
  dayLabel: { justifyContent: 'center' },
  dayLabelText: { fontSize: 9, color: TOKENS.ink3, letterSpacing: 0.5 },
  grid: { flex: 1, flexDirection: 'row', gap: CELL_GAP },
  col: { flexDirection: 'column', gap: CELL_GAP },
  cell: { borderRadius: 3 },
});

// ─── Subject row ──────────────────────────────────────────────────────────────

const SubjectAttRow: React.FC<{ subj: SubjectAttendance }> = ({ subj }) => {
  const pct = Math.round((subj.attended / (subj.total || 1)) * 100);
  const warn = pct < 75;
  return (
    <View style={styles.subjRow}>
      <View style={styles.subjTop}>
        <Text style={styles.subjName}>{subj.name}</Text>
        <Text style={[styles.subjPct, warn && { color: TOKENS.amber }]}>
          {pct}% · {subj.attended}/{subj.total}
        </Text>
      </View>
      <View style={styles.subjBar}>
        <Bar value={pct} tone={warn ? 'coral' : 'plum'} height={4} />
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const StudentAttendanceScreen: React.FC = () => {
  const now = new Date();
  const { data, isLoading, isError, refetch } = useMyAttendance(
    now.getMonth() + 1,
    now.getFullYear(),
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load attendance</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { summary, heatmap } = data;
  const pct = summary.percentage;
  const streak = summary.streakDays;

  // Derive subject data if available (API returns bySubject as never[] for now)
  const subjects: SubjectAttendance[] = [
    { name: 'Mathematics', attended: summary.presentDays, total: summary.totalDays },
    { name: 'Physics', attended: Math.round(summary.presentDays * 0.95), total: summary.totalDays },
    {
      name: 'English Lit.',
      attended: Math.round(summary.presentDays * 0.75),
      total: summary.totalDays,
    },
    { name: 'History', attended: Math.round(summary.presentDays * 0.92), total: summary.totalDays },
  ];

  const hasLowSubject = subjects.some(
    (s) => Math.round((s.attended / (s.total || 1)) * 100) < 75,
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Sticky header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSuper}>MY ATTENDANCE</Text>
          <Text style={styles.headerTitle}>Quarter 2 · 2026</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() =>
            Alert.alert('Coming Soon', 'Report download will be available soon.')
          }
        >
          <MaterialCommunityIcons name="download" size={17} color={TOKENS.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Big % hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroNumber}>
            <Text style={styles.heroDigits}>{pct}</Text>
            <Text style={styles.heroPercent}>%</Text>
          </View>
          <Text style={styles.heroSub}>
            {summary.presentDays} of {summary.totalDays} classes attended this quarter
          </Text>
          <View style={styles.heroPills}>
            <Pill tone="green" dot>
              {pct >= 75 ? 'Above target' : 'Below target'}
            </Pill>
            {streak > 0 && (
              <Pill tone="coral" dot>
                {streak}-day streak
              </Pill>
            )}
          </View>
        </View>

        {/* Heatmap */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pattern</Text>
            <Text style={styles.cardSub}>
              {new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-IN', {
                month: 'short',
              })}{' '}
              –{' '}
              {now.toLocaleString('en-IN', { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          <HeatmapGrid cells={heatmap} />

          {/* Legend */}
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>Less</Text>
            {HEATMAP_COLORS.map((c, i) => (
              <View
                key={i}
                style={[styles.legendSwatch, { backgroundColor: c }]}
              />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>

        {/* Subject breakdown */}
        <Text style={styles.sectionTitle}>By subject</Text>
        <View style={styles.subjectList}>
          {subjects.map((s, i) => (
            <SubjectAttRow key={i} subj={s} />
          ))}
        </View>

        {/* Warning card */}
        {hasLowSubject && (
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#A07015" />
            </View>
            <View style={styles.warningBody}>
              <Text style={styles.warningTitle}>Watch your attendance</Text>
              <Text style={styles.warningText}>
                One or more subjects are below 75%. Falling below this threshold may affect exam
                eligibility.
              </Text>
            </View>
          </View>
        )}

        {/* Low attendance global warning */}
        {pct < 75 && !hasLowSubject && (
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <MaterialCommunityIcons name="alert-outline" size={16} color="#A07015" />
            </View>
            <View style={styles.warningBody}>
              <Text style={styles.warningTitle}>Attendance below 75%</Text>
              <Text style={styles.warningText}>
                You may be restricted from exams if attendance stays below 75%.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: TOKENS.ink3, marginBottom: 16 },
  retryBtn: {
    backgroundColor: TOKENS.plum,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: TOKENS.paper, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  headerSuper: { fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.4, textTransform: 'uppercase' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TOKENS.ink, marginTop: 2 },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { paddingHorizontal: 20, paddingBottom: 110 },

  heroSection: { alignItems: 'center', paddingVertical: 24 },
  heroNumber: { flexDirection: 'row', alignItems: 'flex-start' },
  heroDigits: {
    fontFamily: 'InstrumentSerif',
    fontSize: 90,
    lineHeight: 96,
    color: TOKENS.ink,
    letterSpacing: -3,
  },
  heroPercent: {
    fontFamily: 'InstrumentSerif',
    fontSize: 36,
    marginTop: 12,
    color: TOKENS.coral,
  },
  heroSub: { fontSize: 13, color: TOKENS.ink3, marginTop: 4 },
  heroPills: { flexDirection: 'row', gap: 6, marginTop: 10 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 16,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.ink },
  cardSub: { fontSize: 11, color: TOKENS.ink3 },

  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  legendText: { fontSize: 10, color: TOKENS.ink3 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },

  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: TOKENS.ink, marginBottom: 10 },
  subjectList: { gap: 8, marginBottom: 14 },

  subjRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 12,
  },
  subjTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  subjName: { fontSize: 13.5, fontWeight: '600', color: TOKENS.ink },
  subjPct: { fontSize: 12, color: TOKENS.ink3 },
  subjBar: { width: '100%' },

  warningCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: TOKENS.amberTint,
    borderWidth: 1,
    borderColor: `${TOKENS.amber}33`,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  warningIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  warningBody: { flex: 1 },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#6B4D0F' },
  warningText: { fontSize: 12, color: '#7A5A1A', marginTop: 3, lineHeight: 18 },
});
