import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { customersApi } from '../../api/customers';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParams, 'Register'>;

export function RegisterScreen({ navigation, route }: Props) {
  const { phone, temp_token } = route.params;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { setTokens, setCustomer } = useAuthStore();

  const handleComplete = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await customersApi.register({ name: name.trim(), address: address.trim() || undefined, temp_token });
      setCustomer(res.data);
      const otpRes = await authApi.verifyOtp(phone, '');
      if (otpRes.data.access_token) {
        await setTokens(otpRes.data.access_token, otpRes.data.refresh_token);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      const msg = err?.response?.data?.error?.message ?? 'Registration failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#050D1F', '#0F1F3D']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Step 1 of 1</Text>

        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>

        <Input
          label="Full Name *"
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
          autoCapitalize="words"
        />

        <Input
          label="Home Address (optional)"
          value={address}
          onChangeText={setAddress}
          placeholder="Your delivery address"
          multiline
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 You can browse and select a washerman after registration
          </Text>
        </View>

        <Button
          label="Complete Registration"
          onPress={handleComplete}
          disabled={!name.trim()}
          loading={loading}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.base, paddingTop: 80 },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  progressBar: { height: 4, backgroundColor: Colors.surfaceBorder, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: Colors.gold, borderRadius: 2, width: '100%' },
  infoCard: {
    backgroundColor: `${Colors.gold}1A`,
    borderRadius: 12,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: `${Colors.gold}33`,
  },
  infoText: { ...Typography.body, color: Colors.gold },
});
