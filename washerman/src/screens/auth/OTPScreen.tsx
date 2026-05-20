import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { OTPInput } from '../../components/ui/OTPInput';
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
      if (res.data.is_new_user && res.data.temp_token) {
        navigation.replace('Register', { phone, temp_token: res.data.temp_token });
      } else {
        await setTokens(res.data.access_token, res.data.refresh_token);
      }
    } catch { Alert.alert('Invalid OTP', 'Please check the code and try again.'); }
    finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#050D1F', '#0F1F3D']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>Sent to {phone} <Text style={{ color: Colors.gold }} onPress={() => navigation.goBack()}>Change</Text></Text>
        <OTPInput onComplete={handleComplete} />
        {loading && <Text style={{ ...Typography.body, color: Colors.textSecondary }}>Verifying…</Text>}
        <TouchableOpacity onPress={() => { if (countdown > 0) return; authApi.requestOtp(phone); setCountdown(60); }} disabled={countdown > 0}>
          <Text style={[styles.resend, countdown > 0 && { color: Colors.textDisabled }]}>
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
  resend: { ...Typography.bodyMedium, color: Colors.gold },
});
