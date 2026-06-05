import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { Pill, Bar } from '../../components/ui';
import { useStudentProfile } from '../../hooks/useStudents';
import { AttendanceStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'StudentHub'>;

type TabKey = 'Subjects' | 'Notes' | 'Activity' | 'Family';
const TABS: TabKey[] = ['Subjects', 'Notes', 'Activity', 'Family'];

// ─── Subject row ──────────────────────────────────────────────────────────────

const SubjectRow: React.FC<{
  name: string;
  grade: string;
  pct: number;
  delta: string;
  down?: boolean;
}> = ({ name, grade, pct, delta, down }) => (
  <View style={styles.subjRow}>
    <View style={styles.subjGradeBox}>
      <Text style={styles.subjGrade}>{grade}</Text>
    </View>
    <View style={styles.subjBody}>
      <Text style={styles.subjName}>{name}</Text>
      <View style={styles.subjBarRow}>
        <View style={styles.subjBarWrap}>
          <Bar value={pct} tone="plum" height={4} />
        </View>
        <Text style={styles.subjPct}>{pct}%</Text>
      </View>
    </View>
    <View style={[styles.deltaBadge, { backgroundColor: down ? TOKENS.redTint : TOKENS.greenTint }]}>
      <Text style={[styles.deltaText, { color: down ? TOKENS.red : TOKENS.green }]}>
        {delta}
      </Text>
    </View>
  </View>
);

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

const Sparkline: React.FC = () => (
  <Svg width="100%" height={46} viewBox="0 0 320 46">
    <Defs>
      <SvgGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor={TOKENS.plum500} stopOpacity={0.25} />
        <Stop offset="100%" stopColor={TOKENS.plum500} stopOpacity={0} />
      </SvgGradient>
    </Defs>
    <Path
      d="M0 32 L40 26 L80 30 L120 22 L160 24 L200 14 L240 18 L280 8 L320 12 L320 46 L0 46 Z"
      fill="url(#sparkfill)"
    />
    <Path
      d="M0 32 L40 26 L80 30 L120 22 L160 24 L200 14 L240 18 L280 8 L320 12"
      stroke={TOKENS.plum500}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={320} cy={12} r={4} fill={TOKENS.coral} />
    <Circle cx={320} cy={12} r={8} fill={TOKENS.coral} fillOpacity={0.2} />
  </Svg>
);

// ─── Main screen ─────────────────────────────────────────────────────────────

export const StudentHubScreen: React.FC<Props> = ({ route, navigation }) => {
  const { studentId, studentName, roll } = route.params;
  const [activeTab, setActiveTab] = useState<TabKey>('Subjects');

  // TODO: wire to student-service API
  const { data } = useStudentProfile(studentId);
  const profile = data ?? {
    gpa: 'A+',
    attendance: 91,
    streak: 12,
    subjects: [
      { name: 'Mathematics', grade: 'A', pct: 92, delta: '+3' },
      { name: 'Physics', grade: 'A−', pct: 88, delta: '+5' },
      { name: 'English Lit.', grade: 'B+', pct: 84, delta: '−1', down: true },
      { name: 'History', grade: 'A−', pct: 89, delta: '+2' },
    ],
  };

  const initials = studentName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <LinearGradient
          colors={[TOKENS.plum700, TOKENS.plum]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlow} pointerEvents="none" />

          {/* Nav bar */}
          <View style={styles.heroNav}>
            <TouchableOpacity
              style={styles.heroNavBtn}
              onPress={() => navigation.goBack()}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="chevron-left" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.heroNavLabel}>Class XII-A</Text>
            <TouchableOpacity style={styles.heroNavBtn}>
              <MaterialCommunityIcons name="chat-outline" size={17} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Student identity */}
          <View style={styles.heroIdentity}>
            <View style={styles.heroAvatarWrap}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{initials}</Text>
              </View>
              <View style={styles.heroAvatarBadge}>
                <MaterialCommunityIcons name="check" size={14} color="#fff" />
              </View>
            </View>
            <View style={styles.heroMeta}>
              <Text style={styles.heroRoll}>Roll {roll}</Text>
              <Text style={styles.heroName}>{studentName}</Text>
              <View style={styles.heroPills}>
                <Pill tone="coral" dot>
                  Top 5%
                </Pill>
                <Pill tone="neutral">
                  {profile.attendance}% attendance
                </Pill>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Floating stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            {[
              { v: profile.gpa, l: 'GPA' },
              { v: `${profile.attendance}%`, l: 'ATTENDANCE' },
              { v: `${profile.streak}`, l: 'STREAK' },
            ].map((s, i) => (
              <View key={i} style={styles.statTile}>
                <Text style={styles.statVal}>{s.v}</Text>
                <Text style={styles.statLabel}>{s.l}</Text>
              </View>
            ))}
          </View>

          {/* Sparkline + trend */}
          <View style={styles.trendSection}>
            <View style={styles.trendTop}>
              <View>
                <Text style={styles.trendLabel}>OVERALL TREND</Text>
                <Text style={styles.trendValue}>+4.2 since last quarter</Text>
              </View>
              <Pill tone="green" dot>
                Improving
              </Pill>
            </View>
            <View style={styles.sparklineWrap}>
              <Sparkline />
            </View>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.tabItem}
              onPress={() => setActiveTab(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, activeTab === t && styles.tabLabelActive]}>
                {t}
              </Text>
              {activeTab === t && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Content: Subjects tab */}
        {activeTab === 'Subjects' && (
          <View style={styles.tabContent}>
            {profile.subjects.map((s: { name: string; grade: string; pct: number; delta: string; down?: boolean }, i: number) => (
              <SubjectRow
                key={i}
                name={s.name}
                grade={s.grade}
                pct={s.pct}
                delta={s.delta}
                down={s.down}
              />
            ))}
          </View>
        )}

        {/* Other tabs: coming soon */}
        {activeTab !== 'Subjects' && (
          <View style={styles.comingSoon}>
            <MaterialCommunityIcons name="clock-outline" size={36} color={TOKENS.line} />
            <Text style={styles.comingSoonText}>{activeTab} · Coming soon</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },

  hero: { paddingBottom: 90, overflow: 'hidden', position: 'relative' },
  heroGlow: {
    position: 'absolute',
    top: -30,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: TOKENS.coral,
    opacity: 0.2,
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 18,
  },
  heroNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNavLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4 },

  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  heroAvatarWrap: { position: 'relative' },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: TOKENS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.coral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  heroAvatarText: {
    fontFamily: 'InstrumentSerif',
    fontSize: 44,
    color: '#fff',
  },
  heroAvatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: TOKENS.green,
    borderWidth: 3,
    borderColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: { flex: 1 },
  heroRoll: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroName: {
    fontFamily: 'InstrumentSerif',
    fontSize: 26,
    color: '#fff',
    letterSpacing: -0.3,
    lineHeight: 28,
    marginTop: 4,
    marginBottom: 6,
  },
  heroPills: { flexDirection: 'row', gap: 6 },

  statsCard: {
    marginHorizontal: 16,
    marginTop: -60,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: TOKENS.line,
    shadowColor: TOKENS.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    padding: 16,
    zIndex: 10,
  },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statTile: {
    flex: 1,
    backgroundColor: TOKENS.plumTint,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  statVal: { fontSize: 20, fontWeight: '700', color: TOKENS.ink, letterSpacing: -0.4 },
  statLabel: { fontSize: 9.5, color: TOKENS.ink3, marginTop: 2, letterSpacing: 0.5 },

  trendSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: TOKENS.line2,
    borderStyle: 'dashed',
  },
  trendTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendLabel: { fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.4 },
  trendValue: { fontSize: 14, fontWeight: '700', color: TOKENS.ink, marginTop: 2 },
  sparklineWrap: { marginTop: 8 },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line,
    gap: 22,
  },
  tabItem: { paddingBottom: 10, position: 'relative' },
  tabLabel: { fontSize: 13, fontWeight: '500', color: TOKENS.ink3 },
  tabLabelActive: { fontWeight: '700', color: TOKENS.ink },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: TOKENS.coral,
    borderRadius: 2,
  },

  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  subjRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjGradeBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: TOKENS.plumTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjGrade: {
    fontFamily: 'InstrumentSerif',
    fontSize: 20,
    color: TOKENS.plum,
  },
  subjBody: { flex: 1, minWidth: 0 },
  subjName: { fontSize: 13.5, fontWeight: '600', color: TOKENS.ink },
  subjBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  subjBarWrap: { flex: 1 },
  subjPct: { fontSize: 11, fontWeight: '600', color: TOKENS.ink2 },
  deltaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deltaText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  comingSoon: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  comingSoonText: { fontSize: 14, color: TOKENS.ink3 },
});
