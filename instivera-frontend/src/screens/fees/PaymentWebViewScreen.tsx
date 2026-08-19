import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { TOKENS } from '../../theme/tokens';
import { paymentApi } from '../../api/modules/payment.api';
import { FeesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FeesStackParamList, 'PaymentWebView'>;

type ScreenState = 'opening' | 'polling' | 'success' | 'failure' | 'timeout';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15; // 15 × 2s = 30s

const formatAmount = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const PaymentWebViewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { redirectUrl, paymentId, amount } = route.params;
  const [state, setState] = useState<ScreenState>('opening');
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    setState('polling');
    let count = 0;

    intervalRef.current = setInterval(async () => {
      count += 1;
      setPollCount(count);

      try {
        const status = await paymentApi.getPaymentStatus(paymentId);

        if (status.isCompleted) {
          stopPolling();
          setState('success');
          queryClient.invalidateQueries({ queryKey: ['paymentSummary'] });
          return;
        }

        // Gateway failure states
        if (
          status.gatewayStatus &&
          ['FAILED', 'EXPIRED', 'CANCELLED'].includes(status.gatewayStatus.toUpperCase())
        ) {
          stopPolling();
          setState('failure');
          return;
        }
      } catch {
        // Ignore transient errors; keep polling
      }

      if (count >= MAX_POLLS) {
        stopPolling();
        setState('timeout');
      }
    }, POLL_INTERVAL_MS);
  }, [paymentId, stopPolling, queryClient]);

  // Open browser on mount
  useEffect(() => {
    let mounted = true;

    const open = async () => {
      try {
        await WebBrowser.openBrowserAsync(redirectUrl, {
          showTitle: false,
          toolbarColor: TOKENS.plum,
          enableBarCollapsing: true,
        });
      } finally {
        // Browser closed (dismissed / completed)
        if (mounted) startPolling();
      }
    };

    open();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [redirectUrl, startPolling, stopPolling]);

  const handleDone = () => {
    navigation.popToTop();
  };

  if (state === 'opening') {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
        <Text style={styles.statusText}>Opening PhonePe…</Text>
      </SafeAreaView>
    );
  }

  if (state === 'polling') {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
        <Text style={styles.statusText}>Confirming payment…</Text>
        <Text style={styles.subText}>
          Check {pollCount}/{MAX_POLLS}
        </Text>
      </SafeAreaView>
    );
  }

  if (state === 'success') {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-bold" size={48} color={TOKENS.green} />
        </View>
        <Text style={styles.resultTitle}>Payment Successful!</Text>
        <Text style={styles.resultAmount}>{formatAmount(amount)}</Text>
        <Text style={styles.resultSub}>Your fees have been recorded.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (state === 'failure') {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <View style={[styles.iconCircle, { backgroundColor: TOKENS.redTint }]}>
          <MaterialCommunityIcons name="close-thick" size={48} color={TOKENS.red} />
        </View>
        <Text style={styles.resultTitle}>Payment Failed</Text>
        <Text style={styles.resultSub}>The payment could not be processed.</Text>
        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: TOKENS.red }]} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // timeout
  return (
    <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
      <View style={[styles.iconCircle, { backgroundColor: TOKENS.amberTint }]}>
        <MaterialCommunityIcons name="clock-alert-outline" size={48} color={TOKENS.amber} />
      </View>
      <Text style={styles.resultTitle}>Confirmation Pending</Text>
      <Text style={styles.resultSub}>
        We couldn't confirm your payment within 30 seconds. Check your bank statement or try again.
      </Text>
      <TouchableOpacity style={[styles.doneBtn, { backgroundColor: TOKENS.amber }]} onPress={handleDone}>
        <Text style={styles.doneBtnText}>OK</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: TOKENS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: TOKENS.ink,
    textAlign: 'center',
    marginTop: 12,
  },
  subText: { fontSize: 13, color: TOKENS.ink3 },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: TOKENS.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resultTitle: { fontSize: 24, fontWeight: '700', color: TOKENS.ink, textAlign: 'center' },
  resultAmount: { fontSize: 32, fontWeight: '700', color: TOKENS.green },
  resultSub: {
    fontSize: 14,
    color: TOKENS.ink3,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneBtn: {
    marginTop: 12,
    backgroundColor: TOKENS.plum,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: TOKENS.paper },
});
