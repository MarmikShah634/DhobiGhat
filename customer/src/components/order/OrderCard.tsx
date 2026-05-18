import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, getStatusColor } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { StatusBadge } from '../ui/StatusBadge';
import { Order } from '../../api/orders';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

function formatPaise(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const accentColor = getStatusColor(order.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.card}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.orderNum}>{order.order_number}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.washerman}>
            {order.washerman?.business_name ?? 'Washerman'} ·{' '}
            {order.delivery_mode === 'door_to_door' ? '🚪 Door to Door' : '📦 Drop Off'}
          </Text>
          <View style={styles.row}>
            <Text style={styles.total}>{formatPaise(order.total_paise)}</Text>
            <Text style={styles.date}>
              {new Date(order.pickup_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${Colors.gold}33`,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNum: {
    ...Typography.captionMedium,
    color: Colors.gold,
    fontWeight: '700',
  },
  washerman: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  total: {
    ...Typography.bodyLarge,
    color: Colors.gold,
    fontWeight: '700',
  },
  date: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
