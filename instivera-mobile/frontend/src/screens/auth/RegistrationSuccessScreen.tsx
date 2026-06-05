import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegistrationSuccess'>;

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
  row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
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
  line: { width: 2, flex: 1, backgroundColor: TOKENS.line, minHeight: 28, marginTop: 2 },
  textCol: { flex: 1, paddingBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: TOKENS.ink3 },
  labelDone: { color: TOKENS.green },
  sub: { fontSize: 12, color: TOKENS.ink3, marginTop: 2, lineHeight: 16 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export const RegistrationSuccessScreen: React.FC<Props> = ({ route, navigation }) => {
  const { regId, institutionName } = route.params;

  const handleCopy = async () => {
    try {
      await Share.share({
        message: `My INSTIVERA Registration ID: ${regId}`,
        title: 'Registration ID',
      });
    } catch {
      Alert.alert('Registration ID', regId);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.glowCircle}>
            <View style={styles.checkCircle}>
              <MaterialCommunityIcons name="check" size={48} color={TOKENS.green} />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.subtitle}>Your registration is under review at {institutionName}.</Text>

        {/* Registration ID card */}
        <View style={styles.idCard}>
          <Text style={styles.idLabel}>YOUR REGISTRATION ID</Text>
          <Text style={styles.idValue}>{regId}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <MaterialCommunityIcons name="content-copy" size={16} color={TOKENS.plum} />
            <Text style={styles.copyBtnText}>Copy / Share</Text>
          </TouchableOpacity>
        </View>

        {/* Status timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Application Journey</Text>
          <TimelineStep
            label="Submitted"
            sub="Application received"
            done
          />
          <TimelineStep
            label="Under Review"
            sub="Admin is reviewing your application"
            done={false}
          />
          <TimelineStep
            label="Selection Decision"
            sub="You'll be notified via email & SMS"
            done={false}
          />
          <TimelineStep
            label="Fee Payment"
            sub="Pay registration fee to confirm"
            done={false}
          />
          <TimelineStep
            label="Confirmed"
            sub="Access granted to the app"
            done={false}
            isLast
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate('RegistrationStatus', { regId })}
        >
          <Text style={styles.trackBtnText}>Track Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
          }
        >
          <Text style={styles.loginLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  content: { padding: 24, alignItems: 'center', paddingBottom: 40 },

  illustrationWrap: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  glowCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: TOKENS.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: TOKENS.green,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: TOKENS.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.ink3,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },

  idCard: {
    width: '100%',
    backgroundColor: TOKENS.plumTint,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  idLabel: {
    fontSize: 11,
    color: TOKENS.ink3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  idValue: {
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.plum,
    letterSpacing: 4,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TOKENS.plum,
  },
  copyBtnText: { fontSize: 13, color: TOKENS.plum, fontWeight: '600' },

  timelineCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 20,
    marginBottom: 28,
  },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: TOKENS.ink, marginBottom: 20 },

  trackBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: TOKENS.plum,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  trackBtnText: { fontSize: 15, fontWeight: '600', color: TOKENS.plum },

  loginLink: { paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: TOKENS.ink3, textAlign: 'center' },
});
