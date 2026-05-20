import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { washermenApi } from '../../api/washermen';
import { ordersApi, Order } from '../../api/orders';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';

const ACTIVE_STATUSES = ['accepted', 'collecting', 'collected', 'in_progress', 'ready'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening';
}

function formatPaise(p: number) { return `₹${(p / 100).toFixed(0)}`; }

export function HomeDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { washerman, setWasherman } = useAuthStore();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [todayEarned, setTodayEarned] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pendRes, activeRes] = await Promise.all([
        ordersApi.list({ status: 'pending', limit: 10 }),
        ordersApi.list({ limit: 20 }),
      ]);
      setPendingOrders(pendRes.data.data);
      const active = activeRes.data.data.filter((o: Order) => ACTIVE_STATUSES.includes(o.status));
      setActiveOrders(active);
      const today = new Date().toISOString().split('T')[0];
      const earned = activeRes.data.data
        .filter((o: Order) => o.status === 'delivered' && o.is_paid && o.updated_at?.startsWith(today))
        .reduce((s: number, o: Order) => s + o.total_paise, 0);
      setTodayEarned(earned);
    } catch {} finally { setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleAvailability = async (value: boolean) => {
    setTogglingAvail(true);
    try {
      const res = await washermenApi.updateProfile({ is_available: value });
      setWasherman(res.data);
    } catch { Alert.alert('Error', 'Could not update availability.'); }
    finally { setTogglingAvail(false); }
  };

  const handleAccept = async (order: Order) => {
    try {
      await ordersApi.accept(order.id);
      setPendingOrders((prev) => prev.filter((o) => o.id !== order.id));
      loadData();
    } catch { Alert.alert('Error', 'Could not accept order.'); }
  };

  const handleDecline = (order: Order) => {
    Alert.prompt?.('Decline Order', 'Reason (optional)', async (reason) => {
      try {
        await ordersApi.decline(order.id, reason || undefined);
        setPendingOrders((prev) => prev.filter((o) => o.id !== order.id));
      } catch { Alert.alert('Error', 'Could not decline order.'); }
    }) ?? Alert.alert('Decline Order', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => {
        try { await ordersApi.decline(order.id); setPendingOrders((prev) => prev.filter((o) => o.id !== order.id)); }
        catch { Alert.alert('Error', 'Could not decline order.'); }
      }},
    ]);
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F1F3D', '#162952']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.greeting}>{greeting()}, {washerman?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}>
        <Card>
          <View style={styles.availRow}>
            <View>
              <Text style={styles.availLabel}>Accepting Orders</Text>
              <Text style={[styles.availStatus, { color: washerman?.is_available ? Colors.success : Colors.error }]}>
                {washerman?.is_available ? '● Open' : '● Closed'}
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

        <View style={styles.kpiRow}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.kpiNum}>{pendingOrders.length}</Text>
            <Text style={styles.kpiLabel}>🔔 Pending</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.kpiNum, { color: Colors.info }]}>{activeOrders.length}</Text>
            <Text style={styles.kpiLabel}>⚙️ Active</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.kpiNum]}>{formatPaise(todayEarned)}</Text>
            <Text style={styles.kpiLabel}>💰 Today</Text>
          </Card>
        </View>

        {pendingOrders.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Orders</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{pendingOrders.length}</Text></View>
            </View>
            {pendingOrders.map((order) => (
              <Card key={order.id} style={{ marginBottom: Spacing.sm }}>
                <TouchableOpacity onPress={() => navigation.navigate('Orders', { screen: 'OrderDetail', params: { orderId: order.id } })}>
                  <Text style={styles.orderNum}>{order.order_number}</Text>
                  <Text style={styles.customer}>{order.customer?.name ?? 'Customer'} · {order.delivery_mode === 'door_to_door' ? '🚪' : '📦'} · {new Date(order.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                  <Text style={styles.total}>{formatPaise(order.total_paise)}</Text>
                </TouchableOpacity>
                <View style={styles.actions}>
                  <Button label="Decline" onPress={() => handleDecline(order)} variant="secondary" fullWidth={false} style={{ flex: 1, height: 40 }} textStyle={{ fontSize: 13 }} />
                  <Button label="Accept" onPress={() => handleAccept(order)} fullWidth={false} style={{ flex: 1, height: 40 }} textStyle={{ fontSize: 13 }} />
                </View>
              </Card>
            ))}
          </View>
        )}

        {activeOrders.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            {activeOrders.map((order) => (
              <TouchableOpacity key={order.id} onPress={() => navigation.navigate('Orders', { screen: 'OrderDetail', params: { orderId: order.id } })}>
                <Card style={{ marginBottom: Spacing.sm }}>
                  <View style={styles.activeRow}>
                    <View>
                      <Text style={styles.orderNum}>{order.order_number}</Text>
                      <Text style={styles.customer}>{order.customer?.name ?? 'Customer'}</Text>
                    </View>
                    <StatusBadge status={order.status} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.base },
  greeting: { ...Typography.h3, color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.base, paddingBottom: 32 },
  availRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availLabel: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '600' },
  availStatus: { ...Typography.body, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  kpiNum: { ...Typography.h2, color: Colors.gold },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary },
  badge: { backgroundColor: Colors.gold, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { ...Typography.caption, color: Colors.bgPrimary, fontWeight: '700' },
  orderNum: { ...Typography.bodyMedium, color: Colors.gold, fontWeight: '700' },
  customer: { ...Typography.body, color: Colors.textSecondary },
  total: { ...Typography.h4, color: Colors.textPrimary, fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
