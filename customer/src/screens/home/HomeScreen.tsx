import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useNotificationStore } from '../../store/notificationStore';
import { ordersApi, Order } from '../../api/orders';
import { washermenApi, Washerman } from '../../api/washermen';
import { customersApi } from '../../api/customers';
import { notificationsApi } from '../../api/notifications';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/SkeletonCard';

const ACTIVE_STATUSES = ['pending', 'accepted', 'collecting', 'collected', 'in_progress', 'ready'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { customer } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();
  const { activeOrder, setActiveOrder } = useOrderStore();
  const [selectedWasherman, setSelectedWasherman] = useState<Washerman | null>(null);
  const [favourites, setFavourites] = useState<Washerman[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, notifsRes] = await Promise.all([
        ordersApi.list({ limit: 1 }),
        notificationsApi.list({ unread: true }),
      ]);
      const active = ordersRes.data.data.find((o: Order) => ACTIVE_STATUSES.includes(o.status));
      setActiveOrder(active ?? null);
      setUnreadCount(notifsRes.data.total);

      if (customer?.selected_washerman_id) {
        const wRes = await washermenApi.getById(customer.selected_washerman_id);
        setSelectedWasherman(wRes.data);
      }
      const favRes = await customersApi.getFavourites();
      setFavourites(favRes.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customer]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 80 }]}>
        <SkeletonList count={3} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F1F3D', '#162952']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.greeting}>{greeting()}, {customer?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}>
          <Text style={styles.bell}>🔔</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {activeOrder && (
          <Card>
            <View style={styles.row}>
              <Text style={styles.sectionLabel}>Active Order</Text>
              <StatusBadge status={activeOrder.status} />
            </View>
            <Text style={styles.orderNum}>{activeOrder.order_number}</Text>
            <Text style={styles.washermanName}>{activeOrder.washerman?.business_name ?? 'Your washerman'}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'OrderDetail', params: { orderId: activeOrder.id } })}>
              <Text style={styles.viewLink}>View Order →</Text>
            </TouchableOpacity>
          </Card>
        )}

        {selectedWasherman ? (
          <Button
            label={`New Order with ${selectedWasherman.business_name}`}
            onPress={() => navigation.navigate('Orders', { screen: 'NewOrder' })}
          />
        ) : (
          <Button label="Browse Washermen" onPress={() => navigation.navigate('Browse')} />
        )}

        {selectedWasherman && (
          <Card>
            <Text style={styles.sectionLabel}>Your Washerman</Text>
            <View style={styles.row}>
              <View>
                <Text style={styles.washermanName}>{selectedWasherman.business_name}</Text>
                <Text style={styles.area}>{selectedWasherman.area}</Text>
              </View>
              <View style={[styles.dot, { backgroundColor: selectedWasherman.is_available ? Colors.success : Colors.textDisabled }]} />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Browse', { screen: 'WashermanProfile', params: { washermanId: selectedWasherman.id } })}>
              <Text style={styles.viewLink}>View Profile →</Text>
            </TouchableOpacity>
          </Card>
        )}

        {favourites.length > 0 && (
          <View>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Your Favourites</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Favourites')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
              {favourites.slice(0, 6).map((w: Washerman) => (
                <TouchableOpacity
                  key={w.id}
                  style={styles.favItem}
                  onPress={() => navigation.navigate('Browse', { screen: 'WashermanProfile', params: { washermanId: w.id } })}
                >
                  <View style={styles.favAvatar}>
                    <Text style={styles.favInitials}>{w.business_name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={[styles.favDot, { backgroundColor: w.is_available ? Colors.success : Colors.textDisabled }]} />
                  <Text style={styles.favName} numberOfLines={1}>{w.business_name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.tips}>
          <Text style={styles.sectionTitle}>Fabric Care Tips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {[
              { emoji: '👔', label: 'Cotton', tip: 'Machine wash cold' },
              { emoji: '🧥', label: 'Wool', tip: 'Dry clean only' },
              { emoji: '👗', label: 'Silk', tip: 'Hand wash gently' },
              { emoji: '🩱', label: 'Synthetic', tip: 'Low heat dry' },
            ].map((t) => (
              <View key={t.label} style={styles.tipCard}>
                <Text style={styles.tipEmoji}>{t.emoji}</Text>
                <Text style={styles.tipLabel}>{t.label}</Text>
                <Text style={styles.tipBody}>{t.tip}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.base },
  greeting: { ...Typography.h3, color: Colors.textPrimary },
  bell: { fontSize: 22 },
  scroll: { padding: Spacing.lg, gap: Spacing.base, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { ...Typography.caption, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  orderNum: { ...Typography.bodyMedium, color: Colors.gold, marginTop: 4 },
  washermanName: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '600' },
  area: { ...Typography.body, color: Colors.textSecondary },
  viewLink: { ...Typography.bodyMedium, color: Colors.gold, marginTop: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  seeAll: { ...Typography.body, color: Colors.gold },
  favItem: { alignItems: 'center', width: 64, gap: 4 },
  favAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${Colors.gold}33`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${Colors.gold}66` },
  favInitials: { ...Typography.bodyMedium, color: Colors.gold, fontWeight: '700' },
  favDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 2, right: 2 },
  favName: { ...Typography.tiny, color: Colors.textSecondary, textAlign: 'center' },
  tips: { gap: Spacing.sm },
  tipCard: { width: 120, backgroundColor: Colors.bgSecondary, borderRadius: 12, padding: Spacing.sm, gap: 4, borderWidth: 1, borderColor: `${Colors.gold}33` },
  tipEmoji: { fontSize: 28 },
  tipLabel: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600' },
  tipBody: { ...Typography.caption, color: Colors.gold },
});
