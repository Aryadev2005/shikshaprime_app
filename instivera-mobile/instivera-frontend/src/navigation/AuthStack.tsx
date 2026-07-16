import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SelectInstitutionScreen } from '../screens/auth/SelectInstitutionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { RegistrationSuccessScreen } from '../screens/auth/RegistrationSuccessScreen';
import { RegistrationStatusScreen } from '../screens/auth/RegistrationStatusScreen';
import { useAuthStore } from '../store/authStore';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  // If an institution was already resolved in a previous session (hydrated
  // from SecureStore), skip straight to Login instead of re-prompting.
  const selectedInstitution = useAuthStore((s) => s.selectedInstitution);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={selectedInstitution ? 'Login' : 'SelectInstitution'}
    >
      <Stack.Screen name="SelectInstitution" component={SelectInstitutionScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        initialParams={
          selectedInstitution
            ? {
                tenant: selectedInstitution.tenant,
                institutionName: selectedInstitution.name,
                institutionType: selectedInstitution.type,
              }
            : undefined
        }
      />
      <Stack.Screen name="OTP" component={OtpScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
      <Stack.Screen name="RegistrationStatus" component={RegistrationStatusScreen} />
    </Stack.Navigator>
  );
};
