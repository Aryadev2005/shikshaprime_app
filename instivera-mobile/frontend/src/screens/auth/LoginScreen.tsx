import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TOKENS } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login, isLoading, setSelectedInstitution } = useAuthStore();

  // Pull institution info from route params, fall back to defaults
  const tenant = route.params?.tenant ?? 'collegea';
  const institutionName = route.params?.institutionName ?? tenant;
  const institutionType = route.params?.institutionType ?? 'college';

  const handleLogin = useCallback(async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setError('');
    try {
      // Persist institution before login so it's available after hydration
      await setSelectedInstitution({ tenant, name: institutionName, type: institutionType });
      await login(username, password, tenant);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(msg);
    }
  }, [username, password, tenant, institutionName, institutionType, login, setSelectedInstitution]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>INSTIVERA</Text>
          <Text style={styles.subtitle}>School Management</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Institution display */}
          <View style={styles.institutionField}>
            <MaterialCommunityIcons name="school" size={24} color={TOKENS.coral} />
            <Text style={styles.institutionText}>{institutionName}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Username or Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={TOKENS.ink3}
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={TOKENS.paper} />
            ) : (
              <>
                <MaterialCommunityIcons name="fingerprint" size={24} color={TOKENS.paper} />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('OTP', { email: '' })}
            disabled={isLoading}
          >
            <Text style={styles.otpLink}>Sign In with OTP</Text>
          </TouchableOpacity>

          {/* ── New links ─────────────────────────── */}
          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('SignUp', { tenant, institutionName, institutionType })
            }
            disabled={isLoading}
          >
            <Text style={styles.registerLink}>New student? Register here</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('RegistrationStatus', {})}
            disabled={isLoading}
            style={styles.trackBtn}
          >
            <Text style={styles.trackLink}>Track existing application</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.plumTint,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: TOKENS.plum,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.ink3,
  },
  formContainer: {
    backgroundColor: TOKENS.paper,
    borderRadius: 16,
    padding: 24,
  },
  institutionField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: TOKENS.coralTint,
    borderRadius: 12,
    gap: 12,
  },
  institutionText: {
    flex: 1,
    fontSize: 16,
    color: TOKENS.ink,
    fontWeight: '600',
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
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: TOKENS.surface,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: TOKENS.ink,
  },
  errorContainer: {
    backgroundColor: TOKENS.redTint,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: TOKENS.red,
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: TOKENS.plum,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  signInButtonDisabled: { opacity: 0.6 },
  signInButtonText: {
    color: TOKENS.paper,
    fontSize: 16,
    fontWeight: '700',
  },
  otpLink: {
    textAlign: 'center',
    color: TOKENS.plum500,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: TOKENS.line,
    marginVertical: 16,
  },
  registerLink: {
    textAlign: 'center',
    color: TOKENS.coral,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
  },
  trackBtn: {
    marginTop: 8,
  },
  trackLink: {
    textAlign: 'center',
    color: TOKENS.ink3,
    fontSize: 13,
    paddingVertical: 4,
  },
});
