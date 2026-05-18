import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Size, Radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import * as SecureStore from 'expo-secure-store';

const MENU_ITEMS = [
  { icon: '🔔', label: 'Notifications', screen: 'Notifications' },
  { icon: '📊', label: 'My Accounting', screen: 'Accounting' },
  { icon: '✏️', label: 'Edit Profile', screen: 'EditProfile' },
  { icon: '❓', label: 'Help & Support', screen: null },
  { icon: '📄', label: 'About', screen: null },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { customer, logout, refreshToken } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          const rt = await SecureStore.getItemAsync('refresh_token');
          if (rt) { try { await authApi.logout(rt); } catch {} }
          await logout();
        },
      },
    ]);
  };

  const initials = customer?.name
    ? customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{customer?.name ?? 'Customer'}</Text>
          <Text style={styles.phone}>{customer?.phone}</Text>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.menuItem, styles.signOutItem]} onPress={handleSignOut}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 32 },
  avatarSection: { alignItems: 'center', gap: Spacing.sm },
  avatar: { width: Size.avatarLg, height: Size.avatarLg, borderRadius: Size.avatarLg / 2, backgroundColor: `${Colors.gold}33`, borderWidth: 3, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.h2, color: Colors.gold },
  name: { ...Typography.h2, color: Colors.textPrimary },
  phone: { ...Typography.body, color: Colors.textSecondary },
  menu: { backgroundColor: Colors.bgSecondary, borderRadius: Radius.card, borderWidth: 1, borderColor: `${Colors.gold}33`, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.md },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { ...Typography.bodyLarge, color: Colors.textPrimary, flex: 1 },
  chevron: { ...Typography.h3, color: Colors.textDisabled },
  signOutItem: { borderBottomWidth: 0 },
});
