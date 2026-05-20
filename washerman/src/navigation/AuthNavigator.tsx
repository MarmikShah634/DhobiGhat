import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { PhoneEntryScreen } from '../screens/auth/PhoneEntryScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

export type AuthStackParams = {
  Splash: undefined; Onboarding: undefined; PhoneEntry: undefined;
  OTP: { phone: string }; Register: { phone: string; temp_token: string };
};

const Stack = createNativeStackNavigator<AuthStackParams>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
