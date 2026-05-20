import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, getStatusColor } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { StatusBadge } from '../ui/StatusBadge';
import { Order } from '../../api/orders';

interface OrderCardProps { order: Order; onPress: () => void; actionLabel?: string; onAction?: () => void; }

export function OrderCard({ order, onPress, actionLabel, onAction }: OrderCardProps) {
  const accent = getStatusColor(order.status);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.card}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.num}>{order.order_number}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.customer}>{order.customer?.name ?? 'Customer'} · {order.delivery_mode === 'door_to_door' ? '🚪' : '📦'}</Text>
          <View style={styles.row}>
            <Text style={styles.total}>₹{(order.total_paise / 100).toFixed(0)}</Text>
            <View style={styles.row}>
              <View style={[styles.payDot, { backgroundColor: order.is_paid ? Colors.success : Colors.warning }]} />
              <Text style={{ ...Typography.caption, color: order.is_paid ? Colors.success : Colors.warning }}>
                {order.is_paid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          </View>
          {actionLabel && onAction && (
            <TouchableOpacity onPress={onAction} style={styles.actionBtn}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: Colors.bgSecondary, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.gold}33` },
  accent: { width: 4 },
  content: { flex: 1, padding: Spacing.base, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  num: { ...Typography.captionMedium, color: Colors.gold, fontWeight: '700' },
  customer: { ...Typography.body, color: Colors.textSecondary },
  total: { ...Typography.bodyLarge, color: Colors.gold, fontWeight: '700' },
  payDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  actionBtn: { alignSelf: 'flex-end', borderWidth: 1, borderColor: Colors.gold, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  actionText: { ...Typography.caption, color: Colors.gold, fontWeight: '700' },
});
