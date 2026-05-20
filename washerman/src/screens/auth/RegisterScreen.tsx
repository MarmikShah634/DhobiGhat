import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { washermenApi } from '../../api/washermen';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParams, 'Register'>;

export function RegisterScreen({ navigation, route }: Props) {
  const { phone, temp_token } = route.params;
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const { setTokens, setWasherman } = useAuthStore();

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await washermenApi.register({
        phone, name: name.trim(), business_name: businessName.trim(),
        area: area.trim(), address: address.trim() || undefined, temp_token,
      });
      setWasherman(res.data);
      setUniqueCode(res.data.unique_code);
      const authRes = await authApi.verifyOtp(phone, '');
      if (authRes.data.access_token) await setTokens(authRes.data.access_token, authRes.data.refresh_token);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      Alert.alert('Error', err?.response?.data?.error?.message ?? 'Registration failed.');
    } finally { setLoading(false); }
  };

  const step1Valid = name.trim().length > 0;
  const step2Valid = businessName.trim().length > 0 && area.trim().length > 0;

  return (
    <LinearGradient colors={['#050D1F', '#0F1F3D']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{step === 1 ? 'Personal Info' : 'Business Details'}</Text>
        <Text style={styles.stepLabel}>Step {step} of 2</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {step === 1 ? (
          <>
            <Input label="Full Name *" value={name} onChangeText={setName} placeholder="Your full name" autoCapitalize="words" />
            <Button label="Next" onPress={() => setStep(2)} disabled={!step1Valid} />
          </>
        ) : (
          <>
            <Input label="Business Name *" value={businessName} onChangeText={setBusinessName} placeholder="e.g. Ramesh Laundry" />
            <Input label="Service Area *" value={area} onChangeText={setArea} placeholder="e.g. Andheri West" />
            <Input label="Full Address (optional)" value={address} onChangeText={setAddress} placeholder="Your shop/home address" />

            {uniqueCode ? (
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Your Customer Code</Text>
                <Text style={styles.code}>{uniqueCode}</Text>
                <Text style={styles.codeHint}>Share this with customers to let them link to you</Text>
              </View>
            ) : null}

            <Button label="Complete Registration" onPress={handleComplete} disabled={!step2Valid} loading={loading} />
            <TouchableOpacity onPress={() => setStep(1)}><Text style={styles.back}>← Back</Text></TouchableOpacity>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.base, paddingTop: 80 },
  title: { ...Typography.h1, color: Colors.textPrimary },
  stepLabel: { ...Typography.body, color: Colors.textSecondary },
  progressBar: { height: 4, backgroundColor: Colors.surfaceBorder, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: Colors.gold, borderRadius: 2 },
  codeCard: { backgroundColor: `${Colors.gold}1A`, borderRadius: 12, padding: Spacing.base, borderWidth: 1, borderColor: `${Colors.gold}4D`, alignItems: 'center', gap: 4 },
  codeLabel: { ...Typography.caption, color: Colors.gold },
  code: { ...Typography.h1, color: Colors.gold, letterSpacing: 4 },
  codeHint: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  back: { ...Typography.body, color: Colors.gold, textAlign: 'center' },
});
