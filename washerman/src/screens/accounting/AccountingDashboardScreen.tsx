import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { accountingApi } from '../../api/accounting';
import { Card } from '../../components/ui/Card';

const RANGES = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
];

interface Summary {
  total_earned_paise: number;
  total_unpaid_paise: number;
  total_orders: number;
  customers: Array<{
    customer_id: string;
    customer_name: string;
    total_paise: number;
    unpaid_paise: number;
    order_count: number;
  }>;
}

function formatPaise(p: number) { return `₹${(p / 100).toFixed(0)}`; }

export function AccountingDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [range, setRange] = useState('30d');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await accountingApi.getSummary({ range });
      setSummary(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [range]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Accounting</Text>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity key={r.key} style={[styles.chip, range === r.key && styles.chipActive]} onPress={() => setRange(r.key)}>
            <Text style={[styles.chipText, range === r.key && styles.chipTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
        >
          <View style={styles.kpiRow}>
            <Card style={styles.kpiCard}>
              <Text style={styles.kpiNum}>{formatPaise(summary?.total_earned_paise ?? 0)}</Text>
              <Text style={styles.kpiLabel}>💰 Total Earned</Text>
            </Card>
            <Card style={styles.kpiCard}>
              <Text style={[styles.kpiNum, { color: summary?.total_unpaid_paise ? Colors.warning : Colors.success }]}>
                {formatPaise(summary?.total_unpaid_paise ?? 0)}
              </Text>
              <Text style={styles.kpiLabel}>⏳ Unpaid</Text>
            </Card>
            <Card style={styles.kpiCard}>
              <Text style={styles.kpiNum}>{summary?.total_orders ?? 0}</Text>
              <Text style={styles.kpiLabel}>📋 Orders</Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Customers</Text>
          {(summary?.customers ?? []).length === 0 ? (
            <Card><Text style={styles.empty}>No data for this period</Text></Card>
          ) : (
            (summary?.customers ?? []).map((c) => (
              <TouchableOpacity key={c.customer_id} onPress={() => navigation.navigate('CustomerLedger', { customerId: c.customer_id, customerName: c.customer_name })}>
                <Card style={styles.customerCard}>
                  <View style={styles.customerRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{c.customer_name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerName}>{c.customer_name}</Text>
                      <Text style={styles.customerSub}>{c.order_count} order{c.order_count !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.earned}>{formatPaise(c.total_paise)}</Text>
                      {c.unpaid_paise > 0 && (
                        <Text style={styles.unpaid}>{formatPaise(c.unpaid_paise)} due</Text>
                      )}
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  title: { ...Typography.h1, color: Colors.textPrimary, padding: Spacing.lg, paddingBottom: Spacing.sm },
  rangeRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: 6, borderWidth: 1, borderColor: Colors.surfaceBorder },
  chipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { ...Typography.caption, color: Colors.textSecondary },
  chipTextActive: { color: Colors.bgPrimary, fontWeight: '700' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.base, paddingBottom: 32 },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  kpiCard: { flex: 1, alignItems: 'center' },
  kpiNum: { ...Typography.h3, color: Colors.gold, textAlign: 'center' },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  customerCard: { marginBottom: Spacing.sm },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.gold}33`, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...Typography.h4, color: Colors.gold },
  customerName: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600' },
  customerSub: { ...Typography.caption, color: Colors.textSecondary },
  earned: { ...Typography.bodyMedium, color: Colors.gold, fontWeight: '700' },
  unpaid: { ...Typography.caption, color: Colors.warning },
  chevron: { ...Typography.h3, color: Colors.textDisabled },
  empty: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.base },
});
