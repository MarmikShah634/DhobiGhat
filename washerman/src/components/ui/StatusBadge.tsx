import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusColor } from '../../theme/colors';
import { Typography } from '../../theme/typography';

const LABELS: Record<string, string> = {
  pending: 'Pending', accepted: 'Accepted', collecting: 'Collecting', collected: 'Collected',
  in_progress: 'In Progress', ready: 'Ready', delivered: 'Delivered',
  cancelled: 'Cancelled', declined: 'Declined',
};

export function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);
  const isDark = ['delivered', 'pending'].includes(status);
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.text, { color: isDark ? '#0A1628' : '#FFF' }]}>{LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { ...Typography.captionMedium, fontWeight: '600' },
});
