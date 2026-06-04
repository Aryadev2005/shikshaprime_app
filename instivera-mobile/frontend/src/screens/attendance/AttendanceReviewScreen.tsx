import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useBulkMark } from '../../hooks/useAttendance';
import { ClassStudent, AttendanceStatus } from '../../types/attendance';
import { AttendanceStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'AttendanceReview'>;

type TabFilter = 'all' | 'present' | 'absent';

// View-based donut chart using mask-rotation technique
const DonutChart: React.FC<{ presentCount: number; absentCount: number }> = ({
  presentCount,
  absentCount,
}) => {
  const total = presentCount + absentCount;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;
  const size = 140;
  const strokeWidth = 22;
  const half = size / 2;
  const holeSize = size - strokeWidth * 2;

  // Mask rotation: 0° = covering, -180° = fully revealed
  const leftMaskDeg = -(Math.min(percentage, 50) / 50) * 180;
  const rightMaskDeg = percentage > 50 ? -((percentage - 50) / 50) * 180 : 0;

  return (
    <View style={{ width: size, height: size, borderRadius: half, overflow: 'hidden' }}>
      {/* Green fill (present) */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          backgroundColor: TOKENS.green,
        }}
      />

      {/* Left mask sweeps away as percentage increases 0→50% */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          width: half,
          height: size,
          backgroundColor: TOKENS.redTint,
          transform: [
            { translateX: half / 2 },
            { rotate: `${leftMaskDeg}deg` },
            { translateX: -(half / 2) },
          ],
        }}
      />

      {/* Right mask: static when ≤50%, sweeps away when >50% */}
      {percentage <= 50 ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: half,
            height: size,
            backgroundColor: TOKENS.redTint,
          }}
        />
      ) : (
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: half,
            height: size,
            backgroundColor: TOKENS.redTint,
            transform: [
              { translateX: -(half / 2) },
              { rotate: `${rightMaskDeg}deg` },
              { translateX: half / 2 },
            ],
          }}
        />
      )}

      {/* Donut hole */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth,
          left: strokeWidth,
          width: holeSize,
          height: holeSize,
          borderRadius: holeSize / 2,
          backgroundColor: TOKENS.paper,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: TOKENS.green }}>{percentage}%</Text>
        <Text style={{ fontSize: 10, color: TOKENS.ink3 }}>Present</Text>
      </View>
    </View>
  );
};

const StatusPill: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
  const config = {
    PRESENT: { bg: TOKENS.greenTint, text: TOKENS.green, label: 'Present' },
    ABSENT: { bg: TOKENS.redTint, text: TOKENS.red, label: 'Absent' },
    LATE: { bg: TOKENS.amberTint, text: TOKENS.amber, label: 'Late' },
  }[status];

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <Text style={[styles.pillText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

export const AttendanceReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { students, markings, date, classId } = route.params;
  const [tab, setTab] = useState<TabFilter>('all');
  const { mutate: submitMarkings, isPending } = useBulkMark();

  const presentCount = Object.values(markings).filter(
    (s) => s === 'PRESENT' || s === 'LATE',
  ).length;
  const absentCount = Object.values(markings).filter((s) => s === 'ABSENT').length;

  const filteredStudents = students.filter((s) => {
    const status = markings[s.studentId];
    if (tab === 'present') return status === 'PRESENT' || status === 'LATE';
    if (tab === 'absent') return status === 'ABSENT';
    return true;
  });

  const handleSubmit = () => {
    const payload = {
      students: students.map((s) => ({
        student_id: s.studentId,
        student_code: s.studentCode,
        student_name: s.name,
        status: markings[s.studentId] ?? 'ABSENT',
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <DonutChart presentCount={presentCount} absentCount={absentCount} />
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatRow}>
              <View style={[styles.dot, { backgroundColor: TOKENS.green }]} />
              <Text style={styles.summaryStatLabel}>Present</Text>
              <Text style={styles.summaryStatValue}>{presentCount}</Text>
            </View>
            <View style={styles.summaryStatRow}>
              <View style={[styles.dot, { backgroundColor: TOKENS.red }]} />
              <Text style={styles.summaryStatLabel}>Absent</Text>
              <Text style={styles.summaryStatValue}>{absentCount}</Text>
            </View>
            <View style={styles.summaryStatRow}>
              <View style={[styles.dot, { backgroundColor: TOKENS.ink4 }]} />
              <Text style={styles.summaryStatLabel}>Total</Text>
              <Text style={styles.summaryStatValue}>{students.length}</Text>
            </View>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['all', 'present', 'absent'] as TabFilter[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Student list */}
        <FlatList
          data={filteredStudents}
          keyExtractor={(s) => s.studentId}
          scrollEnabled={false}
          renderItem={({ item: student }) => {
            const status = markings[student.studentId] ?? 'ABSENT';
            return (
              <View style={styles.studentRow}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {student.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {student.name}
                  </Text>
                  <Text style={styles.studentCode}>{student.studentCode}</Text>
                </View>
                <StatusPill status={status} />
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </ScrollView>

      {/* Submit button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color={TOKENS.paper} />
          ) : (
            <Text style={styles.submitBtnText}>Submit Attendance</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: TOKENS.paper,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.ink },

  content: { padding: 20, paddingBottom: 100 },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 20,
  },
  summaryStats: { flex: 1, gap: 10 },
  summaryStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  summaryStatLabel: { flex: 1, fontSize: 14, color: TOKENS.ink3 },
  summaryStatValue: { fontSize: 16, fontWeight: '700', color: TOKENS.ink },
  dateText: { fontSize: 12, color: TOKENS.ink4, marginTop: 4 },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: TOKENS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: TOKENS.paper },
  tabText: { fontSize: 14, color: TOKENS.ink3, fontWeight: '500' },
  tabTextActive: { color: TOKENS.ink, fontWeight: '700' },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 14, fontWeight: '700', color: TOKENS.paper },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: TOKENS.ink },
  studentCode: { fontSize: 12, color: TOKENS.ink3, marginTop: 2 },
  separator: { height: 1, backgroundColor: TOKENS.line2 },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: { fontSize: 12, fontWeight: '600' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: TOKENS.paper,
    borderTopWidth: 1,
    borderTopColor: TOKENS.line,
  },
  submitBtn: {
    backgroundColor: TOKENS.plum,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: TOKENS.paper },
});
