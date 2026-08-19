import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { Pill } from '../../components/ui';
import { useStudentProfile } from '../../hooks/useStudents';
import { AttendanceStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'StudentHub'>;

type TabKey = 'Info' | 'Notes' | 'Activity' | 'Family';
const TABS: TabKey[] = ['Info', 'Notes', 'Activity', 'Family'];

// ─── Main screen ─────────────────────────────────────────────────────────────

export const StudentHubScreen: React.FC<Props> = ({ route, navigation }) => {
  const { studentId, studentName, roll } = route.params;
  const [activeTab, setActiveTab] = useState<TabKey>('Info');

  const { data: profile, isLoading, isError } = useStudentProfile(studentId);

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
              {profile?.email ? (
                <View style={styles.heroPills}>
                  <Pill tone="neutral">{profile.email}</Pill>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>

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

        {/* Content: Info tab */}
        {activeTab === 'Info' && (
          <View style={styles.tabContent}>
            {isLoading ? (
              <View style={styles.comingSoon}>
                <ActivityIndicator size="large" color={TOKENS.plum} />
              </View>
            ) : isError || !profile ? (
              <View style={styles.comingSoon}>
                <MaterialCommunityIcons name="alert-circle-outline" size={36} color={TOKENS.line} />
                <Text style={styles.comingSoonText}>Could not load student info</Text>
              </View>
            ) : (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Roll number</Text>
                  <Text style={styles.infoValue}>{profile.rollNumber || roll}</Text>
                </View>
                {profile.email ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{profile.email}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Other tabs: coming soon */}
        {activeTab !== 'Info' && (
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

  hero: { paddingBottom: 28, overflow: 'hidden', position: 'relative' },
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line2,
  },
  infoLabel: { fontSize: 13, color: TOKENS.ink3 },
  infoValue: { fontSize: 13.5, fontWeight: '600', color: TOKENS.ink },

  comingSoon: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  comingSoonText: { fontSize: 14, color: TOKENS.ink3 },
});
