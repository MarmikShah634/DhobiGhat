import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { OTPInput } from '../../components/ui/OTPInput';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParams, 'OTP'>;

export function OTPScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { setTokens } = useAuthStore();

  useEffect(() => {
    if (countdown === 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleComplete = async (otp: string) => {
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      const { access_token, refresh_token, is_new_user, temp_token } = res.data;
      if (is_new_user && temp_token) {
        navigation.replace('Register', { phone, temp_token });
      } else {
        await setTokens(access_token, refresh_token);
      }
    } catch {
      Alert.alert('Invalid OTP', 'Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await authApi.requestOtp(phone);
      setCountdown(60);
    } catch {
      Alert.alert('Error', 'Could not resend OTP.');
    }
  };

  return (
    <LinearGradient colors={['#050D1F', '#0F1F3D']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          Sent to {phone}{' '}
          <Text style={styles.change} onPress={() => navigation.goBack()}>Change</Text>
        </Text>

        <OTPInput onComplete={handleComplete} />

        {loading && <Text style={styles.verifying}>Verifying…</Text>}

        <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
          <Text style={[styles.resend, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.xl, alignItems: 'center' },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  change: { color: Colors.gold, fontWeight: '600' },
  verifying: { ...Typography.body, color: Colors.textSecondary },
  resend: { ...Typography.bodyMedium, color: Colors.gold },
  resendDisabled: { color: Colors.textDisabled },
});
