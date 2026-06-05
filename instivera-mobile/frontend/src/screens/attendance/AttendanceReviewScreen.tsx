import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { useBulkMark } from '../../hooks/useAttendance';
import { ClassStudent, AttendanceStatus } from '../../types/attendance';
import { AttendanceStackParamList } from '../../navigation/types';
import { Avatar, Pill } from '../../components/ui';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'AttendanceReview'>;
type TabFilter = 'all' | 'present' | 'absent' | 'late';

// ─── SVG Donut ───────────────────────────────────────────────────────────────

const Donut: React.FC<{
  present: number;
  absent: number;
  late: number;
  total: number;
}> = ({ present, absent, late, total }) => {
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const pP = total > 0 ? present / total : 0;
  const pL = total > 0 ? late / total : 0;
  const pA = total > 0 ? absent / total : 0;
  const presentPct = Math.round((present / (total || 1)) * 100);

  return (
    <View style={styles.donutWrapper}>
      <Svg width={110} height={110} viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle cx={50} cy={50} r={r} stroke={TOKENS.line2} strokeWidth={10} fill="none" />
        {/* Present arc */}
        <Circle
          cx={50}
          cy={50}
          r={r}
          stroke={TOKENS.green}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${pP * circumference} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Late arc */}
        <Circle
          cx={50}
          cy={50}
          r={r}
          stroke={TOKENS.amber}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${pL * circumference} ${circumference}`}
          strokeDashoffset={-pP * circumference}
          strokeLinecap="round"
        />
        {/* Absent arc */}
        <Circle
          cx={50}
          cy={50}
          r={r}
          stroke={TOKENS.red}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${pA * circumference} ${circumference}`}
          strokeDashoffset={-(pP + pL) * circumference}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutPct}>{presentPct}%</Text>
        <Text style={styles.donutLabel}>PRESENT</Text>
      </View>
    </View>
  );
};

// ─── Legend row ──────────────────────────────────────────────────────────────

const LegendRow: React.FC<{ dot: string; label: string; value: number }> = ({
  dot,
  label,
  value,
}) => (
  <View style={styles.legendRow}>
    <View style={styles.legendLeft}>
      <View style={[styles.legendDot, { backgroundColor: dot }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
    <Text style={styles.legendValue}>{value}</Text>
  </View>
);

// ─── Status cycling ───────────────────────────────────────────────────────────

const STATUS_CYCLE: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT'];

const nextStatus = (s: AttendanceStatus): AttendanceStatus => {
  const i = STATUS_CYCLE.indexOf(s);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
};

// ─── Student row ─────────────────────────────────────────────────────────────

type StudentRowProps = {
  student: ClassStudent;
  status: AttendanceStatus;
  onToggle: () => void;
};

const StudentRow: React.FC<StudentRowProps> = ({ student, status, onToggle }) => {
  const toneMap: Record<AttendanceStatus, 'green' | 'amber' | 'coral'> = {
    PRESENT: 'green',
    LATE: 'amber',
    ABSENT: 'coral',
  };
  const labelMap: Record<AttendanceStatus, string> = {
    PRESENT: 'Present',
    LATE: 'Late',
    ABSENT: 'Absent',
  };

  return (
    <View style={styles.studentRow}>
      <Avatar name={student.name} size={36} />
      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>
          {student.name}
        </Text>
        <Text style={styles.studentCode}>{student.studentCode}</Text>
      </View>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <Pill tone={toneMap[status]} dot>
          {labelMap[status]}
        </Pill>
      </TouchableOpacity>
    </View>
  );
};

// ─── Tab chip ────────────────────────────────────────────────────────────────

const TabChip: React.FC<{ label: string; active: boolean; tone?: 'coral'; onPress: () => void }> = ({
  label,
  active,
  tone,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.chipText,
        active && styles.chipTextActive,
        !active && tone === 'coral' && { color: TOKENS.coral },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Main screen ─────────────────────────────────────────────────────────────

export const AttendanceReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { students, markings: initialMarkings, date, classId } = route.params;
  const [tab, setTab] = useState<TabFilter>('all');
  const [editableMarkings, setEditableMarkings] = useState<Record<string, AttendanceStatus>>(
    { ...initialMarkings },
  );
  const { mutate: submitMarkings, isPending } = useBulkMark();

  const presentCount = Object.values(editableMarkings).filter(
    (s) => s === 'PRESENT',
  ).length;
  const lateCount = Object.values(editableMarkings).filter((s) => s === 'LATE').length;
  const absentCount = Object.values(editableMarkings).filter((s) => s === 'ABSENT').length;
  const total = students.length;

  const filteredStudents = students.filter((s) => {
    const status = editableMarkings[s.studentId] ?? 'ABSENT';
    if (tab === 'present') return status === 'PRESENT';
    if (tab === 'late') return status === 'LATE';
    if (tab === 'absent') return status === 'ABSENT';
    return true;
  });

  const toggleStatus = (studentId: string) => {
    setEditableMarkings((prev) => ({
      ...prev,
      [studentId]: nextStatus(prev[studentId] ?? 'PRESENT'),
    }));
  };

  const handleSubmit = () => {
    const payload = {
      students: students.map((s) => ({
        student_id: s.studentId,
        student_code: s.studentCode,
        student_name: s.name,
        status: editableMarkings[s.studentId] ?? 'ABSENT',
      })),
      date,
      classInfo: { class_id: classId },
    };

    submitMarkings(payload, {
      onSuccess: (result) => {
        Alert.alert(
          'Attendance Submitted',
          `Marked ${result.markedCount} students for ${result.date}.`,
          [{ text: 'Done', onPress: () => navigation.popToTop() }],
        );
      },
      onError: () => {
        Alert.alert('Error', 'Failed to submit attendance. Please try again.');
      },
    });
  };

  // Format date for display
  const displayDate = (() => {
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return date;
    }
  })();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Class · {classId}</Text>
          <Text style={styles.headerSub}>{displayDate}</Text>
        </View>
        <View style={styles.filterBtn}>
          <MaterialCommunityIcons name="filter-variant" size={18} color={TOKENS.ink} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Donut + breakdown */}
        <View style={styles.summaryCard}>
          <Donut
            present={presentCount}
            absent={absentCount}
            late={lateCount}
            total={total}
          />
          <View style={styles.legendCol}>
            <LegendRow dot={TOKENS.green} label="Present" value={presentCount} />
            <LegendRow dot={TOKENS.red} label="Absent" value={absentCount} />
            <LegendRow dot={TOKENS.amber} label="Late" value={lateCount} />
            <View style={styles.legendDivider} />
            <View style={styles.legendRow}>
              <Text style={styles.legendLabel}>Total</Text>
              <Text style={[styles.legendValue, { fontWeight: '700' }]}>{total}</Text>
            </View>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.tabRow}>
          <TabChip
            label={`All · ${total}`}
            active={tab === 'all'}
            onPress={() => setTab('all')}
          />
          <TabChip
            label="Present"
            active={tab === 'present'}
            onPress={() => setTab('present')}
          />
          <TabChip
            label={`Absent · ${absentCount}`}
            active={tab === 'absent'}
            tone="coral"
            onPress={() => setTab('absent')}
          />
          <TabChip
            label={`Late · ${lateCount}`}
            active={tab === 'late'}
            onPress={() => setTab('late')}
          />
        </View>

        {/* Student list */}
        <View style={styles.listCard}>
          {filteredStudents.map((student, i) => (
            <React.Fragment key={student.studentId}>
              <StudentRow
                student={student}
                status={editableMarkings[student.studentId] ?? 'ABSENT'}
                onToggle={() => toggleStatus(student.studentId)}
              />
              {i < filteredStudents.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
          {filteredStudents.length === 0 && (
            <Text style={styles.emptyText}>No students in this filter</Text>
          )}
        </View>

        {/* Bottom padding for sticky bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky submit bar */}
      <View style={styles.submitBar}>
        <View style={styles.submitBarLeft}>
          <Text style={styles.submitBarSub}>Tap pills to edit · {total} students</Text>
          <Text style={styles.submitBarTitle}>Submit to register</Text>
        </View>
        <TouchableOpacity
          style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" strokeWidth={2.4} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '600', color: TOKENS.ink },
  headerSub: { fontSize: 12, color: TOKENS.ink3, marginTop: 2 },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { paddingHorizontal: 20, paddingBottom: 20 },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 18,
  },

  donutWrapper: {
    width: 110,
    height: 110,
    position: 'relative',
    flexShrink: 0,
  },
  donutCenter: {
    position: 'absolute',
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutPct: {
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.ink,
    letterSpacing: -0.6,
  },
  donutLabel: { fontSize: 9.5, color: TOKENS.ink3, letterSpacing: 0.6, marginTop: -2 },

  legendCol: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 13, color: TOKENS.ink2 },
  legendValue: { fontSize: 13, fontWeight: '600', color: TOKENS.ink },
  legendDivider: {
    height: 1,
    backgroundColor: TOKENS.line2,
    borderStyle: 'dashed',
    marginVertical: 4,
  },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TOKENS.line,
  },
  chipActive: { backgroundColor: TOKENS.plum, borderColor: TOKENS.plum },
  chipText: { fontSize: 12.5, fontWeight: '600', color: TOKENS.ink2 },
  chipTextActive: { color: '#fff' },

  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    paddingHorizontal: 12,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
  },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 13.5, fontWeight: '600', color: TOKENS.ink, letterSpacing: -0.1 },
  studentCode: { fontSize: 11, color: TOKENS.ink3, marginTop: 1 },
  separator: { height: 1, backgroundColor: TOKENS.line2 },
  emptyText: { textAlign: 'center', color: TOKENS.ink3, paddingVertical: 24 },

  submitBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 30,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: TOKENS.line,
    shadowColor: TOKENS.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBarLeft: { flex: 1, paddingHorizontal: 8 },
  submitBarSub: { fontSize: 11, color: TOKENS.ink3 },
  submitBarTitle: { fontSize: 13, fontWeight: '600', color: TOKENS.ink },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: TOKENS.coral,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: TOKENS.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
