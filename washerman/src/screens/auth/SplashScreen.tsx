import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParams, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => { const t = setTimeout(() => navigation.replace('Onboarding'), 2000); return () => clearTimeout(t); }, []);
  return (
    <LinearGradient colors={['#050D1F', '#0F1F3D']} style={styles.container}>
      <Text style={styles.logo}>DhobiGhat</Text>
      <Text style={styles.tagline}>Your Business, Organised</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { ...Typography.displayBold, color: Colors.gold },
  tagline: { ...Typography.bodyLarge, color: Colors.textSecondary },
});
