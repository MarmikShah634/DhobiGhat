import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { ordersApi, Order, OrderStatus } from '../../api/orders';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Input } from '../../components/ui/Input';

type Props = NativeStackScreenProps<any, any>;

const STATUS_STEPS: Array<{ key: OrderStatus; label: string }> = [
  { key: 'pending', label: 'Order Placed' }, { key: 'accepted', label: 'Accepted' },
  { key: 'collecting', label: 'Collecting' }, { key: 'collected', label: 'Collected' },
  { key: 'in_progress', label: 'In Progress' }, { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
];
const STATUS_IDX: Record<string, number> = STATUS_STEPS.reduce((m, s, i) => ({ ...m, [s.key]: i }), {});

export function OrderDetailScreen({ route }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    try { const r = await ordersApi.get(orderId); setOrder(r.data); }
    catch { Alert.alert('Error', 'Could not load order.'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const doAction = async (fn: () => Promise<unknown>) => {
    setActionLoading(true);
    try { await fn(); await loadOrder(); }
    catch { Alert.alert('Error', 'Action failed. Please try again.'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={Colors.gold} size="large" /></View>;
  if (!order) return null;

  const currIdx = STATUS_IDX[order.status] ?? 0;
  const steps = order.delivery_mode === 'door_to_door' ? STATUS_STEPS : STATUS_STEPS.filter((s) => !['collecting', 'collected'].includes(s.key));

  const renderActionBar = () => {
    if (order.status === 'pending') return (
      <View style={styles.actionRow}>
        <Button label="Decline" onPress={() => setShowDeclineModal(true)} variant="destructive" fullWidth={false} style={{ flex: 1 }} />
        <Button label="Accept" onPress={() => doAction(() => ordersApi.accept(order.id))} fullWidth={false} style={{ flex: 1 }} loading={actionLoading} />
      </View>
    );
    if (order.status === 'accepted') return <Button label="Mark as Collecting" onPress={() => doAction(() => ordersApi.startCollecting(order.id))} loading={actionLoading} />;
    if (order.status === 'collecting') return <Button label="Waiting for customer to confirm…" onPress={() => {}} variant="secondary" disabled />;
    if (order.status === 'collected') return <Button label="Mark as In Progress" onPress={() => doAction(() => ordersApi.markInProgress(order.id))} loading={actionLoading} />;
    if (order.status === 'in_progress') return <Button label="Mark as Ready" onPress={() => doAction(() => ordersApi.markReady(order.id))} loading={actionLoading} />;
    if (order.status === 'ready') return <Button label="Mark as Delivered" onPress={() => doAction(() => ordersApi.markDelivered(order.id))} loading={actionLoading} />;
    if (order.status === 'delivered' && !order.is_paid) return <Button label="🪙 Mark as Paid" onPress={() => Alert.alert('Mark as Paid', `₹${(order.total_paise / 100).toFixed(2)} — confirm payment received?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => doAction(() => ordersApi.markPaid(order.id)) },
    ])} loading={actionLoading} />;
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.orderNum}>{order.order_number}</Text>
          <StatusBadge status={order.status} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.sectionLabel}>Customer</Text>
          <Text style={styles.value}>{order.customer?.name ?? 'Customer'}</Text>
          {order.customer?.address && <Text style={styles.subValue}>{order.customer.address}</Text>}
        </Card>

        <Card>
          <Text style={styles.sectionLabel}>Order Status Timeline</Text>
          {steps.map((step, idx) => {
            const stepIdx = STATUS_IDX[step.key] ?? idx;
            const done = stepIdx < currIdx; const current = step.key === order.status;
            return (
              <View key={step.key} style={styles.step}>
                <View style={[styles.dot, done && styles.dotDone, current && styles.dotCurrent]} />
                <Text style={[styles.stepLabel, current && styles.stepLabelActive, !done && !current && styles.stepLabelPending]}>{step.label}</Text>
              </View>
            );
          })}
        </Card>

        {order.items && order.items.length > 0 && (
          <Card>
            <Text style={styles.sectionLabel}>Items</Text>
            {order.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={styles.itemSub}>{item.wash_type_name}</Text>
                </View>
                <Text style={styles.itemQty}>×{item.quantity}</Text>
                <Text style={styles.itemPrice}>₹{(item.subtotal_paise / 100).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{(order.total_paise / 100).toFixed(2)}</Text>
            </View>
          </Card>
        )}

        <Card>
          <Text style={styles.sectionLabel}>Payment</Text>
          <Text style={[styles.payStatus, { color: order.is_paid ? Colors.success : Colors.warning }]}>
            {order.is_paid ? '✓ Paid' : `⏳ Unpaid · ₹${(order.total_paise / 100).toFixed(2)}`}
          </Text>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {renderActionBar()}
      </View>

      <Modal visible={showDeclineModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.declineSheet}>
            <Text style={styles.declineTitle}>Decline Order</Text>
            <Text style={styles.declineSub}>{order.order_number} · {order.customer?.name}</Text>
            <Input label="Reason (optional)" value={declineReason} onChangeText={setDeclineReason} placeholder="Customer will see this" multiline />
            <Button label="Decline Order" onPress={async () => { await doAction(() => ordersApi.decline(order.id, declineReason || undefined)); setShowDeclineModal(false); }} variant="destructive" loading={actionLoading} />
            <TouchableOpacity onPress={() => setShowDeclineModal(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: Spacing.lg, gap: Spacing.sm },
  back: { ...Typography.body, color: Colors.gold },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum: { ...Typography.h3, color: Colors.gold },
  scroll: { padding: Spacing.lg, gap: Spacing.base, paddingBottom: 120 },
  sectionLabel: { ...Typography.caption, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  value: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '600' },
  subValue: { ...Typography.body, color: Colors.textSecondary },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.surfaceBorder },
  dotDone: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  dotCurrent: { borderColor: Colors.gold, backgroundColor: `${Colors.gold}33` },
  stepLabel: { ...Typography.body, color: Colors.textSecondary },
  stepLabelActive: { color: Colors.gold, fontWeight: '700' },
  stepLabelPending: { color: Colors.textDisabled },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  itemName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  itemSub: { ...Typography.caption, color: Colors.textSecondary },
  itemQty: { ...Typography.body, color: Colors.textSecondary },
  itemPrice: { ...Typography.bodyMedium, color: Colors.gold, minWidth: 64, textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { ...Typography.h4, color: Colors.textPrimary },
  totalValue: { ...Typography.h3, color: Colors.gold },
  payStatus: { ...Typography.bodyLarge, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.bgPrimary, borderTopWidth: 1, borderColor: Colors.surfaceBorder },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  declineSheet: { backgroundColor: Colors.bgSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, gap: Spacing.base },
  declineTitle: { ...Typography.h2, color: Colors.textPrimary },
  declineSub: { ...Typography.body, color: Colors.textSecondary },
  cancel: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
