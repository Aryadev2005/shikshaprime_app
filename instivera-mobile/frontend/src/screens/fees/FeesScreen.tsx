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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { usePaymentSummary, useInitiatePayment } from '../../hooks/usePayment';
import { BreakdownItem, RecentPayment } from '../../types/payment';
import { FeesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FeesStackParamList, 'Fees'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatAmount = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const ProgressBar: React.FC<{ paid: number; total: number }> = ({ paid, total }) => {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
};

const PaymentMethodsRow: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const methods = [
    { icon: 'cellphone', label: 'UPI' },
    { icon: 'credit-card-outline', label: 'Card' },
    { icon: 'bank-outline', label: 'NB' },
    { icon: 'cash-multiple', label: 'EMI' },
  ] as const;

  return (
    <View style={styles.methodsRow}>
      {methods.map((m) => (
        <TouchableOpacity key={m.label} style={styles.methodItem} onPress={onPress}>
          <View style={styles.methodIcon}>
            <MaterialCommunityIcons name={m.icon} size={20} color={TOKENS.plum} />
          </View>
          <Text style={styles.methodLabel}>{m.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const FeeRow: React.FC<{ item: BreakdownItem }> = ({ item }) => {
  const isPaid = item.status === 'PAID';
  const isOverdue = item.status === 'OVERDUE';
  const statusColor = isPaid ? TOKENS.green : isOverdue ? TOKENS.red : TOKENS.amber;

  return (
    <View style={styles.feeRow}>
      <View style={styles.feeRowLeft}>
        <Text style={styles.feeLabel}>{item.label}</Text>
        {item.dueDate ? (
          <Text style={[styles.feeDue, isOverdue && { color: TOKENS.red }]}>
            Due {new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        ) : null}
      </View>
      <View style={styles.feeRowRight}>
        <Text style={[styles.feeAmount, isPaid && { color: TOKENS.green }]}>
          {isPaid ? formatAmount(item.amount) : formatAmount(item.balance)}
        </Text>
        <View style={[styles.feeStatusDot, { backgroundColor: statusColor }]} />
      </View>
    </View>
  );
};

const RecentRow: React.FC<{ item: RecentPayment }> = ({ item }) => (
  <View style={styles.recentRow}>
    <View style={styles.recentIcon}>
      <MaterialCommunityIcons name="check-circle" size={18} color={TOKENS.green} />
    </View>
    <View style={styles.recentInfo}>
      <Text style={styles.recentLabel}>{item.label}</Text>
      <Text style={styles.recentDate}>
        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
        {' · '}{item.mode}
      </Text>
    </View>
    <Text style={styles.recentAmount}>{formatAmount(item.amount)}</Text>
  </View>
);

export const FeesScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, isError, refetch } = usePaymentSummary();
  const { mutate: initiate, isPending: isInitiating } = useInitiatePayment();

  const handlePayNow = () => {
    if (!data?.primaryPaymentId) {
      Alert.alert('No pending payment', 'You have no outstanding dues.');
      return;
    }
    initiate(
      { paymentId: data.primaryPaymentId, amount: data.outstanding.totalAmount },
      {
        onSuccess: (result) => {
          navigation.navigate('PaymentWebView', {
            redirectUrl: result.redirectUrl,
            paymentId: result.paymentId,
            amount: result.amount,
          });
        },
        onError: () => Alert.alert('Error', 'Failed to initiate payment. Please try again.'),
      },
    );
  };

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
        <Text style={styles.errorText}>Failed to load fees</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { outstanding, annualTotal, paidSoFar, breakdown, recentPayments } = data;
  const progressWidth = SCREEN_WIDTH - 48;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fees & Payments</Text>
        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Receipt download available soon.')}>
          <MaterialCommunityIcons name="download-outline" size={24} color={TOKENS.ink3} />
        </TouchableOpacity>
      </View>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        {outstanding.isOverdue && (
          <View style={styles.overdueBadge}>
            <MaterialCommunityIcons name="alert" size={12} color={TOKENS.paper} />
            <Text style={styles.overdueBadgeText}>OVERDUE</Text>
          </View>
        )}

        <Text style={styles.heroLabel}>Outstanding Balance</Text>
        <Text style={styles.heroAmount}>{formatAmount(outstanding.totalAmount)}</Text>

        {outstanding.dueDate && (
          <Text style={styles.heroDue}>
            Due by {new Date(outstanding.dueDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long',
            })}
          </Text>
        )}

        {/* Progress */}
        <View style={styles.heroProgressSection}>
          <View style={styles.heroProgressLabels}>
            <Text style={styles.heroProgressPaid}>Paid {formatAmount(paidSoFar)}</Text>
            <Text style={styles.heroProgressTotal}>{formatAmount(annualTotal)} annual</Text>
          </View>
          <View style={[styles.heroProgressTrack, { width: progressWidth }]}>
            <View
              style={[
                styles.heroProgressFill,
                { width: annualTotal > 0 ? `${Math.min((paidSoFar / annualTotal) * 100, 100)}%` : '0%' },
              ]}
            />
          </View>
        </View>

        {/* Pay now button */}
        <TouchableOpacity
          style={[styles.payNowBtn, isInitiating && styles.payNowBtnDisabled]}
          onPress={handlePayNow}
          disabled={isInitiating || outstanding.totalAmount === 0}
        >
          {isInitiating ? (
            <ActivityIndicator color={TOKENS.plum} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={TOKENS.plum} />
              <Text style={styles.payNowBtnText}>Pay Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment methods */}
      <Text style={styles.sectionTitle}>Pay with</Text>
      <PaymentMethodsRow onPress={handlePayNow} />

      {/* What's owed breakdown */}
      {breakdown.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>What's Owed</Text>
          <View style={styles.card}>
            {breakdown.map((item, idx) => (
              <React.Fragment key={item.label}>
                <FeeRow item={item} />
                {idx < breakdown.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </>
      )}

      {/* Recent payments */}
      {recentPayments.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          <View style={styles.card}>
            {recentPayments.map((item, idx) => (
              <React.Fragment key={idx}>
                <RecentRow item={item} />
                {idx < recentPayments.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </>
      )}

      {/* Download receipt */}
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => Alert.alert('Coming Soon', 'Receipt download available soon.')}
      >
        <MaterialCommunityIcons name="file-download-outline" size={18} color={TOKENS.plum} />
        <Text style={styles.downloadBtnText}>Download Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  content: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: TOKENS.ink3, marginBottom: 16 },
  retryBtn: { backgroundColor: TOKENS.plum, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: TOKENS.paper, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TOKENS.ink },

  heroCard: {
    borderRadius: 24,
    backgroundColor: TOKENS.plum,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: TOKENS.coral,
    opacity: 0.15,
    right: -50,
    top: -50,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TOKENS.red,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  overdueBadgeText: { fontSize: 11, color: TOKENS.paper, fontWeight: '700' },
  heroLabel: { fontSize: 13, color: TOKENS.plum300, marginBottom: 8 },
  heroAmount: { fontSize: 44, fontWeight: '700', color: TOKENS.paper, letterSpacing: -1 },
  heroDue: { fontSize: 13, color: TOKENS.plum300, marginTop: 4, marginBottom: 20 },

  heroProgressSection: { marginBottom: 20 },
  heroProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroProgressPaid: { fontSize: 12, color: TOKENS.plum300 },
  heroProgressTotal: { fontSize: 12, color: TOKENS.plum300 },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  heroProgressFill: { height: 6, borderRadius: 3, backgroundColor: TOKENS.coral },

  payNowBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.paper,
    borderRadius: 14,
    paddingVertical: 14,
  },
  payNowBtnDisabled: { opacity: 0.5 },
  payNowBtnText: { fontSize: 16, fontWeight: '700', color: TOKENS.plum },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.ink,
    marginBottom: 12,
    marginTop: 4,
  },

  methodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  methodItem: { alignItems: 'center', gap: 6 },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: TOKENS.plumTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { fontSize: 11, color: TOKENS.ink3, fontWeight: '600' },

  card: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  divider: { height: 1, backgroundColor: TOKENS.line2 },

  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  feeRowLeft: { flex: 1, marginRight: 12 },
  feeLabel: { fontSize: 14, fontWeight: '600', color: TOKENS.ink },
  feeDue: { fontSize: 11, color: TOKENS.ink3, marginTop: 2 },
  feeRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feeAmount: { fontSize: 15, fontWeight: '700', color: TOKENS.ink },
  feeStatusDot: { width: 8, height: 8, borderRadius: 4 },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: { flex: 1 },
  recentLabel: { fontSize: 14, fontWeight: '600', color: TOKENS.ink },
  recentDate: { fontSize: 11, color: TOKENS.ink3, marginTop: 2 },
  recentAmount: { fontSize: 14, fontWeight: '700', color: TOKENS.green },

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

  // Generic progress bar (used by ProgressBar component)
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: TOKENS.line,
    overflow: 'hidden' as const,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: TOKENS.plum },
});
