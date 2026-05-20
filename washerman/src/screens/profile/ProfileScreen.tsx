import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { washermenApi } from '../../api/washermen';
import { authApi } from '../../api/auth';
import { Card } from '../../components/ui/Card';

interface MenuRow { icon: string; label: string; onPress: () => void; danger?: boolean; }

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { washerman, setWasherman, logout } = useAuthStore();
  const [togglingAvail, setTogglingAvail] = useState(false);

  const toggleAvailability = async (value: boolean) => {
    setTogglingAvail(true);
    try {
      const res = await washermenApi.updateProfile({ is_available: value });
      setWasherman(res.data);
    } catch { Alert.alert('Error', 'Could not update availability.'); }
    finally { setTogglingAvail(false); }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        try { await authApi.logout(); } catch {}
        logout();
      }},
    ]);
  };

  const shareCode = () => {
    if (!washerman?.unique_code) return;
    Share.share({
      message: `Add me on DhobiGhat! Use my code: ${washerman.unique_code}`,
      title: 'My DhobiGhat Code',
    });
  };

  const menu: MenuRow[] = [
    { icon: '✏️', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') },
    { icon: '⭐', label: 'My Reviews', onPress: () => navigation.navigate('Reviews') },
    { icon: '🔔', label: 'Notifications', onPress: () => navigation.navigate('Notifications') },
    { icon: '🚪', label: 'Sign Out', onPress: handleSignOut, danger: true },
  ];

  const initials = washerman?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Profile</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          </View>
          <Text style={styles.name}>{washerman?.name ?? '—'}</Text>
          <Text style={styles.phone}>{washerman?.phone ?? ''}</Text>
          {washerman?.business_name && <Text style={styles.biz}>{washerman.business_name}</Text>}
          {washerman?.area && <Text style={styles.area}>📍 {washerman.area}</Text>}
        </Card>

        {washerman?.unique_code && (
          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Customer Code</Text>
            <Text style={styles.code}>{washerman.unique_code}</Text>
            <Text style={styles.codeSub}>Customers use this code to link to you</Text>
            <TouchableOpacity style={styles.shareBtn} onPress={shareCode}>
              <Text style={styles.shareBtnText}>Share Code</Text>
            </TouchableOpacity>
          </Card>
        )}

        <Card>
          <View style={styles.availRow}>
            <View>
              <Text style={styles.availLabel}>Accepting Orders</Text>
              <Text style={[styles.availStatus, { color: washerman?.is_available ? Colors.success : Colors.error }]}>
                {washerman?.is_available ? '● Open for business' : '● Closed'}
              </Text>
            </View>
            <Switch
              value={washerman?.is_available ?? false}
              onValueChange={toggleAvailability}
              disabled={togglingAvail}
              trackColor={{ false: Colors.error, true: Colors.success }}
              thumbColor={Colors.textPrimary}
            />
          </View>
        </Card>

        {menu.map((item) => (
          <TouchableOpacity key={item.label} onPress={item.onPress}>
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuLabel, item.danger && { color: Colors.error }]}>{item.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <Text style={styles.version}>DhobiGhat Washerman v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  title: { ...Typography.h1, color: Colors.textPrimary, padding: Spacing.lg, paddingBottom: Spacing.sm },
  scroll: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.base, paddingBottom: 32 },
  profileCard: { alignItems: 'center', gap: Spacing.xs },
  avatarWrap: { marginBottom: Spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${Colors.gold}33`, borderWidth: 2, borderColor: Colors.gold, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...Typography.h2, color: Colors.gold },
  name: { ...Typography.h3, color: Colors.textPrimary, fontWeight: '700' },
  phone: { ...Typography.body, color: Colors.textSecondary },
  biz: { ...Typography.bodyMedium, color: Colors.gold },
  area: { ...Typography.body, color: Colors.textSecondary },
  codeCard: { alignItems: 'center', gap: Spacing.xs, backgroundColor: `${Colors.gold}1A`, borderColor: `${Colors.gold}4D` },
  codeLabel: { ...Typography.caption, color: Colors.gold, textTransform: 'uppercase', letterSpacing: 1 },
  code: { ...Typography.h1, color: Colors.gold, letterSpacing: 6, fontWeight: '900' },
  codeSub: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  shareBtn: { marginTop: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.gold },
  shareBtnText: { ...Typography.bodyMedium, color: Colors.gold, fontWeight: '700' },
  availRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availLabel: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '600' },
  availStatus: { ...Typography.body, fontWeight: '700' },
  menuCard: { paddingVertical: Spacing.sm },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { ...Typography.bodyLarge, color: Colors.textPrimary, flex: 1 },
  chevron: { ...Typography.h3, color: Colors.textDisabled },
  version: { ...Typography.caption, color: Colors.textDisabled, textAlign: 'center' },
});
