import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useAssignmentList } from '../../hooks/useAssignments';
import { Assignment } from '../../types/assignment';
import { AssignmentsStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AssignmentsStackParamList, 'AssignmentsList'>;

type FilterKey = 'all' | 'PENDING' | 'SUBMITTED' | 'GRADED';

const STATUS_COLORS: Record<string, string> = {
  PENDING: TOKENS.amber,
  SUBMITTED: TOKENS.blue,
  GRADED: TOKENS.green,
  OVERDUE: TOKENS.red,
};

const filterLabels: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'GRADED', label: 'Graded' },
];

const dueTomorrowLabel = (dueDate: string): boolean => {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff === 1;
};

const FeaturedCard: React.FC<{ assignment: Assignment; onPress: () => void }> = ({
  assignment,
  onPress,
}) => (
  <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.featuredGlow} />
    <View style={styles.featuredBadge}>
      <MaterialCommunityIcons name="clock-alert-outline" size={12} color={TOKENS.coral} />
      <Text style={styles.featuredBadgeText}>Due Tomorrow</Text>
    </View>
    <Text style={styles.featuredTitle} numberOfLines={2}>
      {assignment.title}
    </Text>
    <Text style={styles.featuredSubject}>{assignment.subjectName}</Text>
    <View style={styles.featuredProgressRow}>
      <View style={styles.featuredProgressTrack}>
        <View
          style={[styles.featuredProgressFill, { width: `${assignment.progress}%` }]}
        />
      </View>
      <Text style={styles.featuredProgressLabel}>{assignment.progress}%</Text>
    </View>
  </TouchableOpacity>
);

const AssignmentRow: React.FC<{
  item: Assignment;
  onPress: () => void;
}> = ({ item, onPress }) => {
  const statusColor = STATUS_COLORS[item.status] ?? TOKENS.ink3;
  const isGraded = item.status === 'GRADED';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowAccent, { backgroundColor: statusColor }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {isGraded && item.grade ? (
            <View style={styles.gradePill}>
              <Text style={styles.gradePillText}>{item.grade}</Text>
            </View>
          ) : (
            <Text style={[styles.rowStatus, { color: statusColor }]}>{item.status}</Text>
          )}
        </View>
        <Text style={styles.rowSubject}>{item.subjectName}</Text>
        <View style={styles.rowFooter}>
          <MaterialCommunityIcons name="calendar-outline" size={12} color={TOKENS.ink4} />
          <Text style={styles.rowDue}>
            {new Date(item.dueDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
          {!isGraded && (
            <View style={styles.progressBarSmall}>
              <View
                style={[styles.progressBarFill, { width: `${item.progress}%` }]}
              />
            </View>
          )}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={TOKENS.ink4} />
    </TouchableOpacity>
  );
};

export const AssignmentsScreen: React.FC<Props> = ({ navigation }) => {
  const [filter, setFilter] = useState<FilterKey>('all');
  const { data, isLoading, isError, refetch } = useAssignmentList();
  const token = useAuthStore((s) => s.token);

  const isTeacher = (() => {
    try {
      const payload = JSON.parse(atob((token ?? '').split('.')[1]));
      return (payload as { role?: string }).role === 'teacher';
    } catch {
      return false;
    }
  })();

  const assignments = data?.assignments ?? [];

  const featured = assignments.find(
    (a) => a.status === 'PENDING' && dueTomorrowLabel(a.dueDate),
  );

  const filtered =
    filter === 'all' ? assignments : assignments.filter((a) => a.status === filter);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load assignments</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignments</Text>
        {isTeacher && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateAssignment')}
          >
            <MaterialCommunityIcons name="plus" size={22} color={TOKENS.paper} />
          </TouchableOpacity>
        )}
      </View>

      {/* Counters (student only) */}
      {data?.counters && (
        <View style={styles.counters}>
          {[
            { label: 'Total', value: data.counters.total, color: TOKENS.ink },
            { label: 'Pending', value: data.counters.pending, color: TOKENS.amber },
            { label: 'Submitted', value: data.counters.submitted, color: TOKENS.blue },
            { label: 'Graded', value: data.counters.graded, color: TOKENS.green },
          ].map((c) => (
            <View key={c.label} style={styles.counterItem}>
              <Text style={[styles.counterValue, { color: c.color }]}>{c.value}</Text>
              <Text style={styles.counterLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Featured card */}
        {featured && !isTeacher && (
          <FeaturedCard
            assignment={featured}
            onPress={() => navigation.navigate('AssignmentDetail', { id: featured.id })}
          />
        )}

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersRow}
          contentContainerStyle={styles.filtersContent}
        >
          {filterLabels.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, filter === key && styles.chipActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={48} color={TOKENS.line} />
            <Text style={styles.emptyText}>No assignments here</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <AssignmentRow
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('AssignmentDetail', { id: item.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
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
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: TOKENS.ink },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },

  counters: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: TOKENS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
  },
  counterItem: { flex: 1, alignItems: 'center' },
  counterValue: { fontSize: 22, fontWeight: '700' },
  counterLabel: { fontSize: 11, color: TOKENS.ink3, marginTop: 2 },

  scrollContent: { padding: 20, paddingTop: 8, paddingBottom: 40 },

  featuredCard: {
    borderRadius: 20,
    backgroundColor: TOKENS.plum,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  featuredGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: TOKENS.coral,
    opacity: 0.18,
    right: -40,
    top: -40,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,107,61,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  featuredBadgeText: { fontSize: 11, color: TOKENS.coral, fontWeight: '600' },
  featuredTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.paper, marginBottom: 4 },
  featuredSubject: { fontSize: 13, color: TOKENS.plum300, marginBottom: 16 },
  featuredProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featuredProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  featuredProgressFill: { height: 6, borderRadius: 3, backgroundColor: TOKENS.coral },
  featuredProgressLabel: { fontSize: 12, color: TOKENS.plum300 },

  filtersRow: { marginBottom: 8 },
  filtersContent: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: TOKENS.surface,
    borderWidth: 1.5,
    borderColor: TOKENS.line,
  },
  chipActive: { backgroundColor: TOKENS.plum, borderColor: TOKENS.plum },
  chipText: { fontSize: 13, fontWeight: '600', color: TOKENS.ink3 },
  chipTextActive: { color: TOKENS.paper },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.paper,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TOKENS.line2,
  },
  rowAccent: { width: 4, alignSelf: 'stretch' },
  rowBody: { flex: 1, padding: 14 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: TOKENS.ink, marginRight: 8 },
  rowStatus: { fontSize: 12, fontWeight: '600' },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: TOKENS.greenTint,
    borderRadius: 8,
  },
  gradePillText: { fontSize: 12, fontWeight: '700', color: TOKENS.green },
  rowSubject: { fontSize: 12, color: TOKENS.ink3, marginBottom: 8 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowDue: { fontSize: 11, color: TOKENS.ink4, marginRight: 8 },
  progressBarSmall: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: TOKENS.line2,
    overflow: 'hidden',
  },
  progressBarFill: { height: 4, borderRadius: 2, backgroundColor: TOKENS.plum500 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: TOKENS.ink3 },
});
