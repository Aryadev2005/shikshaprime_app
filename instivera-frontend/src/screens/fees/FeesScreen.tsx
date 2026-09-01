import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { usePaymentSummary, useInitiatePayment } from '../../hooks/usePayment';
import { BreakdownItem, RecentPayment } from '../../types/payment';
import { FeesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FeesStackParamList, 'Fees'>;

const formatINR = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Payment method tile ──────────────────────────────────────────────────────

const PayMethod: React.FC<{
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
}> = ({ label, icon, onPress }) => (
  <TouchableOpacity style={styles.methodTile} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.methodIcon}>
      <MaterialCommunityIcons name={icon} size={16} color={TOKENS.plum} />
    </View>
    <Text style={styles.methodLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Separator ────────────────────────────────────────────────────────────────

const Sep: React.FC = () => <View style={styles.sep} />;

// ─── Fee breakdown row ────────────────────────────────────────────────────────

const FeeRow: React.FC<{ item: BreakdownItem }> = ({ item }) => {
  const isPaid = item.status === 'PAID';
  const isOverdue = item.status === 'OVERDUE';
  const amount = isPaid ? item.amount : item.balance;

  return (
    <View style={styles.feeRow}>
      <View style={styles.feeRowLeft}>
        <Text style={styles.feeLabel}>{item.label}</Text>
        {item.dueDate ? (
          <Text style={[styles.feeDue, isOverdue && { color: TOKENS.red }]}>
            Due{' '}
            {new Date(item.dueDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        ) : null}
      </View>
      <Text
        style={[
          styles.feeAmount,
          isPaid && { color: TOKENS.green },
          isOverdue && { color: TOKENS.red },
        ]}
      >
        {formatINR(amount)}
      </Text>
    </View>
  );
};

// ─── Recent payment row ───────────────────────────────────────────────────────

const RecentRow: React.FC<{ item: RecentPayment }> = ({ item }) => (
  <View style={styles.recentRow}>
    <View style={styles.recentIcon}>
      <MaterialCommunityIcons name="check" size={16} color={TOKENS.green} />
    </View>
    <View style={styles.recentInfo}>
      <Text style={styles.recentLabel}>{item.label}</Text>
      <Text style={styles.recentMeta}>
        {new Date(item.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        })}
        {/* Payment mode is not exposed to students by any endpoint; the
            separator is dropped rather than printing a dangling "·". */}
        {item.mode ? ` · ${item.mode}` : ''}
      </Text>
    </View>
    <Text style={styles.recentAmount}>{formatINR(item.amount)}</Text>
  </View>
);

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHead: React.FC<{ title: string; right?: string; onRight?: () => void }> = ({
  title,
  right,
  onRight,
}) => (
  <View style={styles.sectionHead}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {right ? (
      <TouchableOpacity onPress={onRight}>
        <Text style={styles.sectionRight}>{right}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────

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
        onError: () =>
          Alert.alert('Error', 'Failed to initiate payment. Please try again.'),
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
  const paidPct = annualTotal > 0 ? Math.min((paidSoFar / annualTotal) * 100, 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fees</Text>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() =>
            Alert.alert('Coming Soon', 'Receipt download available soon.')
          }
        >
          <MaterialCommunityIcons name="download" size={18} color={TOKENS.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <LinearGradient
          colors={[TOKENS.plum700, TOKENS.plum]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroCard}
        >
          {/* Glow blob */}
          <View style={styles.heroGlow} pointerEvents="none" />

          {outstanding.isOverdue && (
            <View style={styles.overdueBadge}>
              <MaterialCommunityIcons name="alert" size={12} color="#fff" />
              <Text style={styles.overdueBadgeText}>OVERDUE</Text>
            </View>
          )}

          <Text style={styles.heroSubLabel}>OUTSTANDING BALANCE · Q2</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrency}>₹</Text>
            <Text style={styles.heroAmount}>
              {outstanding.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={styles.heroDecimal}>.00</Text>
          </View>

          {outstanding.dueDate && (
            <Text style={styles.heroDue}>
              Due{' '}
              {new Date(outstanding.dueDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
              })}{' '}
              · Late fee after due date
            </Text>
          )}

          {/* Progress bar */}
          <View style={styles.heroProgress}>
            <View style={styles.heroProgressLabels}>
              <Text style={styles.heroProgressLabel}>{formatINR(paidSoFar)} paid</Text>
              <Text style={styles.heroProgressLabel}>of {formatINR(annualTotal)} annual</Text>
            </View>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${paidPct}%` }]} />
            </View>
          </View>

          {/* Pay now button */}
          <TouchableOpacity
            style={[styles.payNowBtn, isInitiating && { opacity: 0.5 }]}
            onPress={handlePayNow}
            disabled={isInitiating || outstanding.totalAmount === 0}
            activeOpacity={0.85}
          >
            {isInitiating ? (
              <ActivityIndicator color={TOKENS.plum} size="small" />
            ) : (
              <>
                <Text style={styles.payNowText}>
                  Pay {formatINR(outstanding.totalAmount)} now
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={TOKENS.plum} />
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* Payment methods */}
        <SectionHead title="Pay with" />
        <View style={styles.methodsGrid}>
          <PayMethod label="UPI" icon="qrcode-scan" onPress={handlePayNow} />
          <PayMethod label="Card" icon="credit-card-outline" onPress={handlePayNow} />
          <PayMethod label="NB" icon="bank-outline" onPress={handlePayNow} />
          <PayMethod label="EMI" icon="cash-multiple" onPress={handlePayNow} />
        </View>

        {/* Fee breakdown */}
        {breakdown.length > 0 && (
          <>
            <SectionHead
              title="What's owed"
              right="View invoice"
              onRight={() =>
                Alert.alert('Coming Soon', 'Invoice view will be available soon.')
              }
            />
            <View style={styles.listCard}>
              {breakdown.map((item, idx) => (
                <React.Fragment key={item.label}>
                  <FeeRow item={item} />
                  {idx < breakdown.length - 1 && <Sep />}
                </React.Fragment>
              ))}
              <Sep />
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { fontWeight: '700' }]}>Total</Text>
                <Text style={[styles.feeAmount, { fontSize: 16, fontWeight: '700' }]}>
                  {formatINR(outstanding.totalAmount)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Recent payments */}
        {recentPayments.length > 0 && (
          <>
            <SectionHead title="Recent payments" right="All" />
            <View style={styles.recentList}>
              {recentPayments.map((item, idx) => (
                <RecentRow key={idx} item={item} />
              ))}
            </View>
          </>
        )}

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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TOKENS.ink },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TOKENS.surface,
    borderWidth: 1,
    borderColor: TOKENS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { paddingHorizontal: 16, paddingBottom: 20 },

  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: TOKENS.coral,
    opacity: 0.3,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: TOKENS.red,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  overdueBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  heroSubLabel: { fontSize: 11.5, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.4 },
  heroAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
  heroCurrency: { fontSize: 22, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  heroAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1.4,
    lineHeight: 48,
  },
  heroDecimal: { fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  heroDue: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 },

  heroProgress: { marginTop: 16, marginBottom: 16 },
  heroProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroProgressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  heroProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  heroProgressFill: { height: 6, borderRadius: 999, backgroundColor: TOKENS.coral },

  payNowBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  payNowText: { fontSize: 15, fontWeight: '600', color: TOKENS.plum },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: TOKENS.ink },
  sectionRight: { fontSize: 12, color: TOKENS.plum, fontWeight: '600' },

  methodsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  methodTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.line,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  methodIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: TOKENS.plumTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { fontSize: 11, fontWeight: '600', color: TOKENS.ink2 },

  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  sep: {
    height: 1,
    backgroundColor: TOKENS.line2,
    marginHorizontal: 0,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  feeRowLeft: { flex: 1, marginRight: 12 },
  feeLabel: { fontSize: 13.5, color: TOKENS.ink2, fontWeight: '500' },
  feeDue: { fontSize: 11, color: TOKENS.ink3, marginTop: 2 },
  feeAmount: { fontSize: 13.5, color: TOKENS.ink, fontWeight: '600', letterSpacing: -0.2 },

  recentList: { gap: 8, marginBottom: 24 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 11,
  },
  recentIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: TOKENS.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: { flex: 1, minWidth: 0 },
  recentLabel: { fontSize: 13.5, fontWeight: '600', color: TOKENS.ink },
  recentMeta: { fontSize: 11, color: TOKENS.ink3, marginTop: 1 },
  recentAmount: { fontSize: 13.5, fontWeight: '700', color: TOKENS.ink, letterSpacing: -0.2 },
});
