import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useMyAttendance } from '../../hooks/useAttendance';
import { HeatmapCell } from '../../types/attendance';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HEATMAP_COLS = 9;
const HEATMAP_PADDING = 24;
const CELL_GAP = 4;
const CELL_SIZE = Math.floor(
  (SCREEN_WIDTH - HEATMAP_PADDING * 2 - CELL_GAP * (HEATMAP_COLS - 1)) / HEATMAP_COLS,
);

const cellColor = (status: HeatmapCell['status']): string => {
  if (status === 'PRESENT') return TOKENS.green;
  if (status === 'ABSENT') return TOKENS.red;
  return TOKENS.line;
};

const HeatmapGrid: React.FC<{ cells: HeatmapCell[] }> = ({ cells }) => {
  const rows: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += HEATMAP_COLS) {
    rows.push(cells.slice(i, i + HEATMAP_COLS));
  }

  return (
    <View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.heatmapRow}>
          {row.map((cell, ci) => (
            <View
              key={ci}
              style={[styles.heatmapCell, { backgroundColor: cellColor(cell.status) }]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

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
  const lowAttendance = summary.percentage < 75;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Attendance</Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Coming Soon', 'Report download will be available soon.')}
        >
          <MaterialCommunityIcons name="download-outline" size={24} color={TOKENS.ink3} />
        </TouchableOpacity>
      </View>

      {/* Giant percentage */}
      <View style={styles.heroCard}>
        <Text style={styles.heroPercent}>{summary.percentage}%</Text>
        <Text style={styles.heroLabel}>Overall Attendance</Text>

        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary.presentDays}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: TOKENS.red }]}>{summary.absentDays}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary.totalDays}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: TOKENS.coral }]}>
              {summary.streakDays}
            </Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>
      </View>

      {/* Low attendance warning */}
      {lowAttendance && (
        <View style={styles.warningCard}>
          <MaterialCommunityIcons name="alert-outline" size={20} color={TOKENS.amber} />
          <Text style={styles.warningText}>
            Your attendance is below 75%. You may be restricted from exams.
          </Text>
        </View>
      )}

      {/* Heatmap */}
      <View style={styles.heatmapCard}>
        <Text style={styles.sectionTitle}>Attendance Calendar</Text>
        <Text style={styles.heatmapSubtitle}>April 1 – Today</Text>

        <View style={styles.legendRow}>
          {(['PRESENT', 'ABSENT', null] as const).map((s, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cellColor(s) }]} />
              <Text style={styles.legendLabel}>
                {s === 'PRESENT' ? 'Present' : s === 'ABSENT' ? 'Absent' : 'No data'}
              </Text>
            </View>
          ))}
        </View>

        <HeatmapGrid cells={heatmap} />
      </View>

      {/* Download button */}
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => Alert.alert('Coming Soon', 'Report download will be available soon.')}
      >
        <MaterialCommunityIcons name="file-download-outline" size={18} color={TOKENS.plum} />
        <Text style={styles.downloadBtnText}>Download Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  content: { padding: 24, paddingBottom: 40 },
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
    marginBottom: 24,
  },
  headerLabel: { fontSize: 20, fontWeight: '700', color: TOKENS.ink },

  heroCard: {
    backgroundColor: TOKENS.plum,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroPercent: {
    fontSize: 72,
    fontWeight: '700',
    color: TOKENS.paper,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    lineHeight: 80,
  },
  heroLabel: { fontSize: 14, color: TOKENS.plum300, marginTop: 4, marginBottom: 24 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '700', color: TOKENS.paper },
  statLabel: { fontSize: 11, color: TOKENS.plum300, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: TOKENS.plum700 },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: TOKENS.amberTint,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  warningText: { flex: 1, fontSize: 13, color: TOKENS.amber, lineHeight: 20 },

  heatmapCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TOKENS.ink, marginBottom: 2 },
  heatmapSubtitle: { fontSize: 12, color: TOKENS.ink3, marginBottom: 16 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { fontSize: 11, color: TOKENS.ink3 },

  heatmapRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
    marginBottom: CELL_GAP,
  },
  heatmapCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },

  downloadBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: TOKENS.plum,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: TOKENS.plumTint,
  },
  downloadBtnText: { fontSize: 15, fontWeight: '600', color: TOKENS.plum },
});
