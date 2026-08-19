import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { useAssignmentList } from '../../hooks/useAssignments';
import { Assignment } from '../../types/assignment';
import { AssignmentsStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { Avatar, Pill, Bar } from '../../components/ui';

type Props = NativeStackScreenProps<AssignmentsStackParamList, 'AssignmentsList'>;
type FilterKey = 'all' | 'PENDING' | 'SUBMITTED' | 'GRADED';

const isDueTomorrow = (dueDate: string): boolean => {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff === 1;
};

const relativeLabel = (dueDate: string): string => {
  try {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'In 1 day';
    if (diff < 7) return `In ${diff} days`;
    if (diff < 14) return 'In 1 week';
    return due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dueDate;
  }
};

// ─── Featured card ────────────────────────────────────────────────────────────

const FeaturedCard: React.FC<{ assignment: Assignment; onPress: () => void }> = ({
  assignment,
  onPress,
}) => (
  <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
    <LinearGradient
      colors={[TOKENS.plumDeep, TOKENS.plum, TOKENS.plum700]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.featured}
    >
      {/* Glow blob */}
      <View style={styles.featuredGlow} pointerEvents="none" />

      <View style={styles.featuredBadgeRow}>
        <View style={styles.featuredDueBadge}>
          <View style={styles.featuredDueDot} />
          <Text style={styles.featuredDueBadgeText}>DUE TOMORROW</Text>
        </View>
        <Text style={styles.featuredSubBadge}>{assignment.subjectName?.toUpperCase()}</Text>
      </View>

      <Text style={styles.featuredTitle} numberOfLines={2}>
        {assignment.title}
      </Text>
      <Text style={styles.featuredDesc}>Submit as PDF · {assignment.progress}% done</Text>

      <View style={styles.featuredFooter}>
        <View style={styles.featuredTeacher}>
          <Avatar name={assignment.teacherName ?? 'Teacher'} size={26} />
          <View>
            <Text style={styles.featuredTeacherName}>
              {assignment.teacherName ?? 'Teacher'}
            </Text>
            <Text style={styles.featuredTeacherSub}>
              {relativeLabel(assignment.dueDate)}
            </Text>
          </View>
        </View>
        <View style={styles.featuredStartBtn}>
          <Text style={styles.featuredStartText}>Start</Text>
          <MaterialCommunityIcons name="arrow-right" size={13} color="#fff" />
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Assignment row ───────────────────────────────────────────────────────────

type AsgnStatus = 'pending' | 'draft' | 'done' | 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE';

const getRowConfig = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'graded') return { iconBg: TOKENS.greenTint, iconColor: TOKENS.green, icon: 'check' };
  if (s === 'submitted') return { iconBg: TOKENS.plumTint, iconColor: TOKENS.plum, icon: 'send' };
  if (s === 'overdue') return { iconBg: TOKENS.redTint, iconColor: TOKENS.red, icon: 'alert-circle-outline' };
  return { iconBg: TOKENS.plumTint, iconColor: TOKENS.plum, icon: 'file-document-outline' };
};

const AsgnRow: React.FC<{ item: Assignment; onPress: () => void }> = ({ item, onPress }) => {
  const cfg = getRowConfig(item.status);
  const isGraded = item.status === 'GRADED';
  const isOverdue = item.status === 'OVERDUE';
  const due = relativeLabel(item.dueDate);

  return (
    <TouchableOpacity style={styles.asgnRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.asgnIcon, { backgroundColor: cfg.iconBg }]}>
        <MaterialCommunityIcons name={cfg.icon as any} size={17} color={cfg.iconColor} />
      </View>
      <View style={styles.asgnBody}>
        <View style={styles.asgnTop}>
          <Text style={styles.asgnSubject}>{item.subjectName?.toUpperCase()}</Text>
          <Text
            style={[
              styles.asgnDue,
              isGraded && { color: TOKENS.green },
              isOverdue && { color: TOKENS.red },
            ]}
          >
            {isGraded ? 'Submitted' : due}
          </Text>
        </View>
        <Text style={styles.asgnTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {isGraded ? (
          <View style={styles.asgnGradeRow}>
            {item.grade ? (
              <Pill tone="green" dot>
                Graded · {item.grade}/100
              </Pill>
            ) : null}
            <Text style={styles.asgnFeedback}>Feedback ready</Text>
          </View>
        ) : (
          <View style={styles.asgnProgressRow}>
            <View style={styles.asgnBarWrap}>
              <Bar value={item.progress ?? 0} tone={isOverdue ? 'coral' : 'plum'} height={4} />
            </View>
            <Text style={styles.asgnProgressPct}>{item.progress ?? 0}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'GRADED', label: 'Graded' },
];

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

  const assignments: Assignment[] = data?.assignments ?? [];
  const counters = data?.counters;

  const featured = !isTeacher
    ? assignments.find((a) => a.status === 'PENDING' && isDueTomorrow(a.dueDate))
    : undefined;

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Header area */}
        <View style={styles.headerArea}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerSuper}>Your work</Text>
              <Text style={styles.headerTitle}>Assignments</Text>
            </View>
            {isTeacher && (
              <TouchableOpacity
                style={styles.addFAB}
                onPress={() => navigation.navigate('CreateAssignment')}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={17} color={TOKENS.ink3} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assignments…"
              placeholderTextColor={TOKENS.ink3}
              editable={false}
            />
            <MaterialCommunityIcons name="sort-variant" size={17} color={TOKENS.ink3} />
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
            {FILTER_CHIPS.map(({ key, label }) => {
              const count =
                key === 'all'
                  ? counters?.total
                  : key === 'PENDING'
                  ? counters?.pending
                  : key === 'SUBMITTED'
                  ? counters?.submitted
                  : counters?.graded;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, filter === key && styles.chipActive]}
                  onPress={() => setFilter(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>
                    {label}{count !== undefined ? ` · ${count}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured card */}
        {featured && (
          <View style={styles.section}>
            <FeaturedCard
              assignment={featured}
              onPress={() => navigation.navigate('AssignmentDetail', { id: featured.id })}
            />
          </View>
        )}

        {/* This week / list */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>
              {isTeacher ? 'All assignments' : 'This week'}
            </Text>
            <Text style={styles.listHeaderCount}>{filtered.length} items</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={48}
                color={TOKENS.line}
              />
              <Text style={styles.emptyText}>No assignments here</Text>
            </View>
          ) : (
            <View style={styles.asgnList}>
              {filtered.map((item) => (
                <AsgnRow
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate('AssignmentDetail', { id: item.id })}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 110 }} />
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

  headerArea: { backgroundColor: TOKENS.paper, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerSuper: { fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.4, textTransform: 'uppercase' },
  headerTitle: {
    fontFamily: 'InstrumentSerif',
    fontSize: 30,
    color: TOKENS.ink,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginTop: 4,
  },
  addFAB: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.plum,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },

  searchBar: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TOKENS.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: TOKENS.ink3 },

  chipsRow: { marginBottom: 4 },
  chipsContent: { gap: 6, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TOKENS.line,
  },
  chipActive: { backgroundColor: TOKENS.plum, borderColor: TOKENS.plum },
  chipText: { fontSize: 12, fontWeight: '600', color: TOKENS.ink2 },
  chipTextActive: { color: '#fff' },

  section: { paddingHorizontal: 20, paddingTop: 18 },

  featured: {
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredGlow: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: TOKENS.coral,
    opacity: 0.35,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  featuredDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,61,0.2)',
  },
  featuredDueDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: TOKENS.coralWarm,
  },
  featuredDueBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: TOKENS.coralWarm,
    letterSpacing: 0.5,
  },
  featuredSubBadge: { fontSize: 11.5, color: 'rgba(255,255,255,0.6)' },
  featuredTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.4,
    lineHeight: 25,
    marginBottom: 10,
  },
  featuredDesc: { fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 18, marginBottom: 16 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredTeacher: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuredTeacherName: { fontSize: 11.5, color: '#fff', fontWeight: '600' },
  featuredTeacherSub: { fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  featuredStartBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: TOKENS.coral,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: TOKENS.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  featuredStartText: { fontSize: 12.5, fontWeight: '600', color: '#fff' },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  listHeaderTitle: { fontSize: 14.5, fontWeight: '700', color: TOKENS.ink },
  listHeaderCount: { fontSize: 12, color: TOKENS.ink3 },

  asgnList: { gap: 8 },
  asgnRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  asgnIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  asgnBody: { flex: 1, minWidth: 0 },
  asgnTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  asgnSubject: { fontSize: 10, color: TOKENS.ink3, letterSpacing: 0.5, fontWeight: '600' },
  asgnDue: { fontSize: 11, color: TOKENS.ink3, fontWeight: '600' },
  asgnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.ink,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  asgnGradeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  asgnFeedback: { fontSize: 11, color: TOKENS.ink3 },
  asgnProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  asgnBarWrap: { flex: 1 },
  asgnProgressPct: { fontSize: 10.5, color: TOKENS.ink3, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: TOKENS.ink3 },
});
