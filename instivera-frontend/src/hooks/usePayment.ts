import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/modules/payment.api';
import { InitiatePaymentInput } from '../types/payment';

const PAYMENT_KEYS = {
  summary: ['paymentSummary'] as const,
  history: ['paymentHistory'] as const,
  status: (paymentId: string) => ['paymentStatus', paymentId] as const,
};

export const usePaymentSummary = () =>
  useQuery({
    queryKey: PAYMENT_KEYS.summary,
    queryFn: paymentApi.getPaymentSummary,
    staleTime: 120_000,
  });

export const usePaymentHistory = () =>
  useQuery({
    queryKey: PAYMENT_KEYS.history,
    queryFn: paymentApi.getPaymentHistory,
    staleTime: 120_000,
  });

export const usePaymentStatus = (paymentId: string, enabled = true) =>
  useQuery({
    queryKey: PAYMENT_KEYS.status(paymentId),
    queryFn: () => paymentApi.getPaymentStatus(paymentId),
    enabled: enabled && Boolean(paymentId),
    staleTime: 0, // always fresh for polling
    refetchInterval: false, // caller controls polling manually
  });

export const useInitiatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InitiatePaymentInput) => paymentApi.initiatePayment(data),
    onSuccess: () => {
      // Invalidate summary so balance updates after a successful initiation
      queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.summary });
    },
  });
};
