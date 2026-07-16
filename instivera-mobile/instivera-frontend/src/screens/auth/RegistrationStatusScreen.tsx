import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { AuthStackParamList } from '../../navigation/types';
import { RegistrationStatus } from '../../types/registration';
import { useRegistrationStatus } from '../../hooks/useRegistration';
import { Pill, PillTone } from '../../components/ui';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegistrationStatus'>;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  RegistrationStatus | string,
  { label: string; tone: PillTone }
> = {
  SUBMITTED: { label: 'Submitted', tone: 'plum' },
  UNDER_REVIEW: { label: 'Under Review', tone: 'plum' },
  REGISTRATION_PENDING: { label: 'Registration Fee Pending', tone: 'amber' },
  REGISTRATION_COMPLETED: { label: 'Registered · Awaiting Admission', tone: 'green' },
  SELECTED: { label: 'Selected — Payment Required', tone: 'amber' },
  PAYMENT_PENDING: { label: 'Payment Pending', tone: 'amber' },
  PAYMENT_COMPLETED: { label: 'Admission Confirmed', tone: 'green' },
  REJECTED: { label: 'Not Selected', tone: 'coral' },
};

const TIMELINE_STEPS: Array<{
  key: RegistrationStatus | string;
  label: string;
  sub: string;
}> = [
  { key: 'SUBMITTED', label: 'Submitted', sub: 'Application received' },
  { key: 'UNDER_REVIEW', label: 'Under Review', sub: 'Admin reviewing your application' },
  { key: 'SELECTED', label: 'Selection Decision', sub: 'You\'ll be notified via email & SMS' },
  { key: 'PAYMENT_PENDING', label: 'Fee Payment', sub: 'Pay fee to confirm seat' },
  { key: 'PAYMENT_COMPLETED', label: 'Confirmed', sub: 'Access granted to the app' },
];

const STATUS_ORDER: string[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'REGISTRATION_PENDING',
  'REGISTRATION_COMPLETED',
  'SELECTED',
  'PAYMENT_PENDING',
  'PAYMENT_COMPLETED',
];

const getStepDone = (stepKey: string, currentStatus: string): boolean => {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  return stepIdx <= currentIdx;
};

// ─── Timeline step ────────────────────────────────────────────────────────────

const TimelineStep: React.FC<{
  label: string;
  sub: string;
  done: boolean;
  isLast?: boolean;
}> = ({ label, sub, done, isLast }) => (
  <View style={tlStyles.row}>
    <View style={tlStyles.dotCol}>
      <View style={done ? tlStyles.dotDone : tlStyles.dotPending}>
        {done && <MaterialCommunityIcons name="check" size={10} color="#fff" />}
      </View>
      {!isLast && <View style={tlStyles.line} />}
    </View>
    <View style={tlStyles.textCol}>
      <Text style={[tlStyles.label, done && tlStyles.labelDone]}>{label}</Text>
      <Text style={tlStyles.sub}>{sub}</Text>
    </View>
  </View>
);

const tlStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  dotCol: { alignItems: 'center', width: 20 },
  dotDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TOKENS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: TOKENS.line,
    backgroundColor: TOKENS.paper,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: TOKENS.line,
    minHeight: 24,
    marginTop: 2,
  },
  textCol: { flex: 1, paddingBottom: 22 },
  label: { fontSize: 13, fontWeight: '600', color: TOKENS.ink3 },
  labelDone: { color: TOKENS.ink },
  sub: { fontSize: 12, color: TOKENS.ink3, marginTop: 2, lineHeight: 16 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export const RegistrationStatusScreen: React.FC<Props> = ({ route, navigation }) => {
  const initialRegId = route.params?.regId ?? '';
  const [inputRegId, setInputRegId] = useState(initialRegId);
  const [queryRegId, setQueryRegId] = useState(initialRegId || null);

  const { data, isLoading, isError, refetch } = useRegistrationStatus(queryRegId);

  const handleTrack = () => {
    const trimmed = inputRegId.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter your Registration ID.');
      return;
    }
    setQueryRegId(trimmed);
  };

  const handlePayment = () => {
    if (data?.payment_url) {
      Linking.openURL(data.payment_url).catch(() =>
        Alert.alert('Unable to open', 'Please contact your institution for payment details.'),
      );
    } else {
      Alert.alert('Payment', 'Contact your institution for payment details.');
    }
  };

  const statusCfg = data ? (STATUS_CONFIG[data.status] ?? { label: data.status, tone: 'plum' as PillTone }) : null;
  const showPayBtn = data && (data.status === 'SELECTED' || data.status === 'PAYMENT_PENDING' || data.status === 'REGISTRATION_PENDING');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Application</Text>
        {queryRegId ? (
          <TouchableOpacity onPress={() => refetch()} hitSlop={8}>
            <MaterialCommunityIcons name="refresh" size={22} color={TOKENS.plum} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ID entry */}
        {!queryRegId && (
          <View style={styles.entryCard}>
            <Text style={styles.entryLabel}>Enter your Registration ID</Text>
            <TextInput
              style={styles.entryInput}
              placeholder="e.g. REG-20260118014723-9511"
              value={inputRegId}
              onChangeText={setInputRegId}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleTrack}
            />
            <TouchableOpacity style={styles.trackBtn} onPress={handleTrack}>
              <Text style={styles.trackBtnText}>Track</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Change ID link */}
        {queryRegId && (
          <TouchableOpacity
            style={styles.changeIdBtn}
            onPress={() => { setQueryRegId(null); setInputRegId(''); }}
          >
            <Text style={styles.changeIdText}>
              Tracking: <Text style={styles.changeIdValue}>{queryRegId}</Text>
              {'  '}
              <Text style={styles.changeIdLink}>Change</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={TOKENS.plum} />
            <Text style={styles.loadingText}>Fetching status…</Text>
          </View>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={TOKENS.red} />
            <Text style={styles.errorText}>Unable to fetch registration details.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Result */}
        {data && !isLoading && (
          <>
            {/* Student info */}
            <View style={styles.infoCard}>
              <Text style={styles.studentName}>
                {data.first_name} {data.last_name}
              </Text>
              <Text style={styles.infoRow}>{data.program_name} · {data.class_name}</Text>
              {data.department_name ? (
                <Text style={styles.infoRow}>{data.department_name}</Text>
              ) : null}
              <Text style={styles.infoRow}>Academic Year: {data.academic_year}</Text>
              <Text style={styles.infoRow}>
                Applied:{' '}
                {new Date(data.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Status badge */}
            <View style={styles.statusCard}>
              <Text style={styles.statusCardLabel}>Current Status</Text>
              {statusCfg && (
                <View style={styles.pillWrap}>
                  <Pill tone={statusCfg.tone} dot>
                    {statusCfg.label}
                  </Pill>
                </View>
              )}
            </View>

            {/* Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Application Journey</Text>
              {TIMELINE_STEPS.map((ts, i) => (
                <TimelineStep
                  key={ts.key}
                  label={ts.label}
                  sub={ts.sub}
                  done={getStepDone(ts.key, data.status)}
                  isLast={i === TIMELINE_STEPS.length - 1}
                />
              ))}
            </View>

            {/* Payment CTA */}
            {showPayBtn && (
              <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
                <MaterialCommunityIcons name="credit-card-outline" size={18} color="#fff" />
                <Text style={styles.payBtnText}>Pay Registration Fee</Text>
              </TouchableOpacity>
            )}

            {/* Rejected state */}
            {data.status === 'REJECTED' && (
              <View style={styles.rejectedCard}>
                <MaterialCommunityIcons name="information-outline" size={20} color={TOKENS.red} />
                <Text style={styles.rejectedText}>
                  Your application was not selected this time. You may contact the institution for
                  more information.
                </Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: TOKENS.ink,
  },

  content: { padding: 20, paddingBottom: 40 },

  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: TOKENS.line,
    marginBottom: 20,
    gap: 12,
  },
  entryLabel: { fontSize: 15, fontWeight: '600', color: TOKENS.ink },
  entryInput: {
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: TOKENS.ink,
    backgroundColor: TOKENS.surface,
    letterSpacing: 1,
  },
  trackBtn: {
    backgroundColor: TOKENS.plum,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  trackBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  changeIdBtn: { marginBottom: 16 },
  changeIdText: { fontSize: 13, color: TOKENS.ink3, textAlign: 'center' },
  changeIdValue: { color: TOKENS.ink, fontWeight: '600' },
  changeIdLink: { color: TOKENS.plum, fontWeight: '600' },

  centered: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, color: TOKENS.ink3 },

  errorCard: {
    backgroundColor: TOKENS.redTint,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  errorText: { fontSize: 14, color: TOKENS.red, textAlign: 'center' },
  retryBtn: {
    backgroundColor: TOKENS.red,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  infoCard: {
    backgroundColor: TOKENS.plumTint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 4,
  },
  studentName: { fontSize: 18, fontWeight: '700', color: TOKENS.ink, marginBottom: 4 },
  infoRow: { fontSize: 13, color: TOKENS.ink2 },

  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
    gap: 10,
  },
  statusCardLabel: { fontSize: 12, color: TOKENS.ink3, letterSpacing: 0.5, textTransform: 'uppercase' },
  pillWrap: { transform: [{ scale: 1.2 }] },

  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 18,
    marginBottom: 18,
  },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.ink, marginBottom: 18 },

  payBtn: {
    backgroundColor: TOKENS.coral,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: TOKENS.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  rejectedCard: {
    backgroundColor: TOKENS.redTint,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  rejectedText: { flex: 1, fontSize: 13, color: TOKENS.red, lineHeight: 18 },
});
