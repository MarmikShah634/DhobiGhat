import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { ordersApi, Order } from '../../api/orders';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';

type Props = NativeStackScreenProps<any, any>;

function formatPaise(p: number) { return `₹${(p / 100).toFixed(2)}`; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export function CustomerLedgerScreen({ route }: Props) {
  const { customerId, customerName } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const totalEarned = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total_paise, 0);
  const totalUnpaid = orders.filter((o) => o.status === 'delivered' && !o.is_paid).reduce((s, o) => s + o.total_paise, 0);

  const load = useCallback(async () => {
    try {
      const res = await ordersApi.list({ customer_id: customerId, limit: 100 });
      setOrders(res.data.data);
    } catch { Alert.alert('Error', 'Could not load orders.'); }
    finally { setLoading(false); }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>{customerName}</Text>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          ListHeaderComponent={(
            <View>
              <View style={styles.kpiRow}>
                <Card style={styles.kpi}>
                  <Text style={styles.kpiNum}>{formatPaise(totalEarned)}</Text>
                  <Text style={styles.kpiLabel}>Total Earned</Text>
                </Card>
                <Card style={[styles.kpi, { borderColor: totalUnpaid > 0 ? Colors.warning : Colors.surfaceBorder }]}>
                  <Text style={[styles.kpiNum, { color: totalUnpaid > 0 ? Colors.warning : Colors.success }]}>{formatPaise(totalUnpaid)}</Text>
                  <Text style={styles.kpiLabel}>Outstanding</Text>
                </Card>
              </View>
              <Text style={styles.sectionTitle}>Order History</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
              <Card style={styles.orderCard}>
                <View style={styles.orderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderNum}>{item.order_number}</Text>
                    <Text style={styles.orderDate}>{formatDate(item.pickup_date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <StatusBadge status={item.status} />
                    <Text style={styles.amount}>{formatPaise(item.total_paise)}</Text>
                    {item.status === 'delivered' && !item.is_paid && (
                      <Text style={styles.unpaidTag}>Unpaid</Text>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Card><Text style={styles.empty}>No orders found</Text></Card>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: Spacing.lg, gap: Spacing.xs },
  back: { ...Typography.body, color: Colors.gold },
  title: { ...Typography.h2, color: Colors.textPrimary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 32 },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  kpi: { flex: 1, alignItems: 'center', borderWidth: 1 },
  kpiNum: { ...Typography.h3, color: Colors.gold },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  orderCard: { marginBottom: 0 },
  orderRow: { flexDirection: 'row', alignItems: 'flex-start' },
  orderNum: { ...Typography.bodyMedium, color: Colors.gold, fontWeight: '700' },
  orderDate: { ...Typography.caption, color: Colors.textSecondary },
  amount: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '700' },
  unpaidTag: { ...Typography.caption, color: Colors.warning, fontWeight: '700' },
  empty: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.base },
});
