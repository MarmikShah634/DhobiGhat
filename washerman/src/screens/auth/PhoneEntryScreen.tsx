import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth';

type Props = NativeStackScreenProps<AuthStackParams, 'PhoneEntry'>;

export function PhoneEntryScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const isValid = phone.length === 10 && /^[0-9]{10}$/.test(phone);

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await authApi.requestOtp(`+91${phone}`);
      navigation.navigate('OTP', { phone: `+91${phone}` });
    } catch { Alert.alert('Error', 'Failed to send OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#050D1F', '#0F1F3D']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Register Your Business</Text>
        <Text style={styles.subtitle}>Start managing orders professionally</Text>
        <View style={styles.inputRow}>
          <View style={styles.code}><Text style={{ ...Typography.bodyLarge, color: Colors.textPrimary }}>🇮🇳 +91</Text></View>
          <View style={{ flex: 1 }}>
            <Input value={phone} onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" keyboardType="numeric" maxLength={10} />
          </View>
        </View>
        <Button label="Continue" onPress={handleContinue} disabled={!isValid} loading={loading} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.base },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  code: { height: 52, paddingHorizontal: Spacing.base, backgroundColor: Colors.bgPrimary, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center', justifyContent: 'center' },
});
