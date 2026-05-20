import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';

const { width } = Dimensions.get('window');

const PAGES = [
  { icon: '👕', title: 'Quality Laundry at Your Doorstep', subtitle: 'Trusted washermen from your neighbourhood, at your service.' },
  { icon: '📍', title: 'Track Your Order in Real Time', subtitle: 'Stay updated at every step from pickup to delivery.' },
  { icon: '⭐', title: 'Rate and Review Your Dhobi', subtitle: 'Your feedback helps maintain quality for the whole community.' },
];

type Props = NativeStackScreenProps<AuthStackParams, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goNext = () => {
    if (current < PAGES.length - 1) {
      const next = current + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrent(next);
    } else {
      navigation.replace('PhoneEntry');
    }
  };

  return (
    <LinearGradient colors={['#050D1F', '#0F1F3D']} style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('PhoneEntry')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {PAGES.map((page, i) => (
          <View key={i} style={[styles.page, { width }]}>
            <Text style={styles.pageIcon}>{page.icon}</Text>
            <Text style={styles.pageTitle}>{page.title}</Text>
            <Text style={styles.pageSubtitle}>{page.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={current === PAGES.length - 1 ? 'Get Started' : 'Next'}
          onPress={goNext}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skip: { position: 'absolute', top: 56, right: Spacing.lg, zIndex: 10 },
  skipText: { ...Typography.body, color: Colors.gold },
  page: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  pageIcon: { fontSize: 80 },
  pageTitle: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center' },
  pageSubtitle: { ...Typography.bodyLarge, color: Colors.textSecondary, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textDisabled },
  dotActive: { backgroundColor: Colors.gold, width: 20 },
  footer: { padding: Spacing.lg, paddingBottom: 48 },
});
