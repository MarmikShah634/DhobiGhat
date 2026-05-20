import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { accountingApi, AccountingSummary } from '../../api/accounting';
import { ordersApi, Order } from '../../api/orders';
import { Card } from '../../components/ui/Card';

const RANGES = [
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: '3 Months', days: 90 },
];

export function AccountingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [range, setRange] = useState(1);

  useEffect(() => {
    const end = new Date();
    const start = new Date(Date.now() - RANGES[range].days * 86400000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    Promise.all([
      accountingApi.getSummary({ start_date: fmt(start), end_date: fmt(end) }),
      ordersApi.list({ status: 'delivered', limit: 20 }),
    ]).then(([sumRes, ordRes]) => {
      setSummary(sumRes.data);
      setOrders(ordRes.data.data);
    }).catch(() => {});
  }, [range]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Accounting</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.rangeRow}>
          {RANGES.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              style={[styles.rangeChip, range === i && styles.rangeActive]}
              onPress={() => setRange(i)}
            >
              <Text style={[styles.rangeText, range === i && styles.rangeTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {summary && (
          <View style={styles.kpiRow}>
            <Card style={{ flex: 1 }}>
              <Text style={styles.kpiLabel}>Total Spent</Text>
              <Text style={styles.kpiValue}>₹{(summary.total_revenue_paise / 100).toFixed(0)}</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={styles.kpiLabel}>Amount Due</Text>
              <Text style={[styles.kpiValue, { color: summary.unpaid_revenue_paise > 0 ? Colors.warning : Colors.success }]}>
                ₹{(summary.unpaid_revenue_paise / 100).toFixed(0)}
              </Text>
            </Card>
          </View>
        )}

        <View>
          <Text style={styles.sectionTitle}>Recent Delivered Orders</Text>
          {orders.map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View>
                <Text style={styles.orderNum}>{o.order_number}</Text>
                <Text style={styles.orderDate}>{new Date(o.pickup_date).toLocaleDateString('en-IN')}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>₹{(o.total_paise / 100).toFixed(2)}</Text>
                <View style={[styles.payBadge, { backgroundColor: o.is_paid ? `${Colors.success}33` : `${Colors.warning}33` }]}>
                  <Text style={[styles.payBadgeText, { color: o.is_paid ? Colors.success : Colors.warning }]}>
                    {o.is_paid ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: Spacing.lg, gap: Spacing.sm },
  back: { ...Typography.body, color: Colors.gold },
  title: { ...Typography.h1, color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.base, paddingBottom: 32 },
  rangeRow: { flexDirection: 'row', gap: Spacing.sm },
  rangeChip: { borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: 6, borderWidth: 1, borderColor: Colors.surfaceBorder },
  rangeActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  rangeText: { ...Typography.caption, color: Colors.textSecondary },
  rangeTextActive: { color: Colors.bgPrimary, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  kpiValue: { ...Typography.h2, color: Colors.gold },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, backgroundColor: Colors.bgSecondary, borderRadius: Radius.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: `${Colors.gold}33` },
  orderNum: { ...Typography.bodyMedium, color: Colors.gold },
  orderDate: { ...Typography.caption, color: Colors.textSecondary },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700' },
  payBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  payBadgeText: { ...Typography.tiny, fontWeight: '700' },
});
