import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { ordersApi, Order } from '../../api/orders';
import { OrderCard } from '../../components/order/OrderCard';
import { EmptyState } from '../../components/ui/EmptyState';

const FILTERS = [
  { key: '', label: 'All' }, { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'Active' }, { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' }, { key: 'cancelled', label: 'Cancelled' },
];

export function OrdersListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await ordersApi.list({ status: filter || undefined, limit: 50 });
      setOrders(res.data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const getNextAction = (o: Order): { label: string; action: () => Promise<void> } | null => {
    if (o.status === 'accepted') return { label: 'Start Collecting', action: () => ordersApi.startCollecting(o.id).then(() => load()) };
    if (o.status === 'collected') return { label: 'In Progress', action: () => ordersApi.markInProgress(o.id).then(() => load()) };
    if (o.status === 'in_progress') return { label: 'Mark Ready', action: () => ordersApi.markReady(o.id).then(() => load()) };
    if (o.status === 'ready') return { label: 'Deliver', action: () => ordersApi.markDelivered(o.id).then(() => load()) };
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Orders</Text>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} style={[styles.chip, filter === f.key && styles.chipActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        renderItem={({ item }) => {
          const action = getNextAction(item);
          return (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              actionLabel={action?.label}
              onAction={action?.action}
            />
          );
        }}
        ListEmptyComponent={<EmptyState icon="📋" title="No orders found" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  title: { ...Typography.h1, color: Colors.textPrimary, padding: Spacing.lg, paddingBottom: Spacing.sm },
  filters: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, flexWrap: 'wrap' },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: 6, borderWidth: 1, borderColor: Colors.surfaceBorder },
  chipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { ...Typography.caption, color: Colors.textSecondary },
  chipTextActive: { color: Colors.bgPrimary, fontWeight: '700' },
  list: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 32 },
});
