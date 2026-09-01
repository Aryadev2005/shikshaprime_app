import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TOKENS } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/modules/auth.api';
import { AuthStackParamList } from '../../navigation/types';

type OtpScreenProps = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

export const OtpScreen: React.FC<OtpScreenProps> = ({ route, navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(route.params?.email || '');
  const [showEmailInput, setShowEmailInput] = useState(!route.params?.email);

  const tenant = route.params?.tenant;
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const { login } = useAuthStore();

  // No institution resolved — OTP login can't proceed without a tenant.
  useEffect(() => {
    if (!tenant) {
      navigation.replace('SelectInstitution');
    }
  }, [tenant, navigation]);

  // NOTE: this countdown hook must run unconditionally — placing it after an
  // early return changes the hook count between renders and crashes React.
  useEffect(() => {
    if (timeLeft === 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Nothing to render while the redirect above is in flight.
  if (!tenant) return null;

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are filled
    if (newOtp.every((digit) => digit)) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join('');

    if (codeToVerify.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await authApi.verifyOtp({ email, otp: codeToVerify });
      await login(email, '', tenant); // Will use token from response
      // Navigation handled by root navigator
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
      setError(errorMessage);
      setOtp(['', '', '', '', '', '']);
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    try {
      await authApi.sendOtp({ email });
      setTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>We've sent a verification code to your email</Text>
      </View>

      <View style={styles.formContainer}>
        {showEmailInput ? (
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isVerifying}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                if (email) {
                  setShowEmailInput(false);
                  handleResendOtp();
                }
              }}
              disabled={!email || isVerifying}
            >
              <Text style={styles.submitButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent }) =>
                    handleOtpKeyPress(index, nativeEvent.key)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  editable={!isVerifying}
                />
              ))}
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
              onPress={() => handleVerifyOtp()}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color={TOKENS.paper} />
              ) : (
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {timeLeft > 0 ? (
                <Text style={styles.timerText}>Resend OTP in {timeLeft}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isVerifying}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.plumTint,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: TOKENS.plum,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.ink3,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: TOKENS.paper,
    borderRadius: 16,
    padding: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.ink,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: TOKENS.ink,
    backgroundColor: TOKENS.surface,
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: '15%',
    height: 56,
    borderWidth: 2,
    borderColor: TOKENS.line,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: TOKENS.ink,
    backgroundColor: TOKENS.surface,
  },
  errorContainer: {
    backgroundColor: TOKENS.redTint,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: TOKENS.red,
    fontSize: 14,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: TOKENS.plum,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: TOKENS.paper,
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: TOKENS.plum,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: TOKENS.paper,
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 14,
    color: TOKENS.ink3,
  },
  resendLink: {
    fontSize: 14,
    color: TOKENS.plum500,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: TOKENS.ink3,
    fontWeight: '500',
  },
});
