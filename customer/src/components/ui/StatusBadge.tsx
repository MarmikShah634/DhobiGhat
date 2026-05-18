import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusColor } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

interface StatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  collecting: 'Collecting',
  collected: 'Collected',
  in_progress: 'In Progress',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  declined: 'Declined',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = STATUS_LABELS[status] ?? status;
  const isDark = ['delivered', 'pending'].includes(status);

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.text, { color: isDark ? '#0A1628' : '#FFFFFF' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.captionMedium,
    fontWeight: '600',
  },
});
