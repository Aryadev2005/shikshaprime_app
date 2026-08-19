import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useMyProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/authStore';

const getInitials = (first: string, last: string): string => {
  const f = (first[0] ?? '').toUpperCase();
  const l = (last[0] ?? '').toUpperCase();
  return f + l;
};

export const ProfileScreen: React.FC = () => {
  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const logout = useAuthStore((s) => s.logout);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const isTeacher = profile.type === 'teacher';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerArea}>
          <Text style={styles.headerSuper}>Account</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          {profile.profile_picture ? (
            <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {getInitials(profile.first_name, profile.last_name)}
              </Text>
            </View>
          )}
          <Text style={styles.fullName}>{fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{isTeacher ? 'Teacher' : 'Student'}</Text>
          </View>
        </View>

        {/* Contact card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="email-outline" size={16} color={TOKENS.plum} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={TOKENS.plum} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Phone</Text>
              <Text style={styles.rowValue}>{profile.phone || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Role-specific card */}
        {isTeacher ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Employment</Text>

            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="badge-account-outline" size={16} color={TOKENS.plum} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Employee ID</Text>
                <Text style={styles.rowValue}>{profile.employee_id || '—'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="domain" size={16} color={TOKENS.plum} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Department</Text>
                <Text style={styles.rowValue}>
                  {profile.department_id != null ? String(profile.department_id) : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="briefcase-outline" size={16} color={TOKENS.plum} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Designation</Text>
                <Text style={styles.rowValue}>{profile.designation || '—'}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Academic</Text>

            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="identifier" size={16} color={TOKENS.plum} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Roll Number</Text>
                <Text style={styles.rowValue}>{profile.roll_number || '—'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="school-outline" size={16} color={TOKENS.plum} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Class</Text>
                <Text style={styles.rowValue}>
                  {profile.class_id != null ? String(profile.class_id) : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="book-open-variant" size={16} color={TOKENS.plum} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Program</Text>
                <Text style={styles.rowValue}>
                  {profile.program_id != null ? String(profile.program_id) : '—'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <MaterialCommunityIcons name="logout" size={18} color={TOKENS.red} />
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
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

  headerArea: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 4,
    backgroundColor: TOKENS.paper,
  },
  headerSuper: {
    fontSize: 11,
    color: TOKENS.ink3,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: 'InstrumentSerif',
    fontSize: 30,
    color: TOKENS.ink,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginTop: 4,
  },

  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.ink,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: TOKENS.plumTint,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.plum,
    textTransform: 'capitalize',
  },

  card: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: TOKENS.ink3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: TOKENS.plumTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 11, color: TOKENS.ink3, fontWeight: '600', marginBottom: 2 },
  rowValue: { fontSize: 14, color: TOKENS.ink, fontWeight: '500' },
  divider: {
    height: 1,
    backgroundColor: TOKENS.line2,
    marginVertical: 10,
    marginLeft: 44,
  },

  logoutSection: { paddingHorizontal: 20, marginTop: 8 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TOKENS.redTint,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FCCFCF',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: TOKENS.red },
});
