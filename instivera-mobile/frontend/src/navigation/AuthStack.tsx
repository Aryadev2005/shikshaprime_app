import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { RegistrationSuccessScreen } from '../screens/auth/RegistrationSuccessScreen';
import { RegistrationStatusScreen } from '../screens/auth/RegistrationStatusScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OtpScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
      <Stack.Screen name="RegistrationStatus" component={RegistrationStatusScreen} />
    </Stack.Navigator>
  );
};
