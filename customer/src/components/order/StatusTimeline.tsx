import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, getStatusColor } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { OrderStatus } from '../../api/orders';

const DOOR_TO_DOOR_STEPS: Array<{ key: OrderStatus; label: string }> = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'collecting', label: 'Collecting' },
  { key: 'collected', label: 'Collected' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
];

const DROP_OFF_STEPS: Array<{ key: OrderStatus; label: string }> = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
];

const ORDER_INDEX: Record<string, number> = {
  pending: 0, accepted: 1, collecting: 2, collected: 3,
  in_progress: 4, ready: 5, delivered: 6,
};

interface StatusTimelineProps {
  status: OrderStatus;
  deliveryMode: 'door_to_door' | 'drop_off';
  timestamps?: Partial<Record<OrderStatus, string>>;
}

export function StatusTimeline({ status, deliveryMode, timestamps }: StatusTimelineProps) {
  const steps = deliveryMode === 'door_to_door' ? DOOR_TO_DOOR_STEPS : DROP_OFF_STEPS;
  const isTerminal = status === 'cancelled' || status === 'declined';
  const currentIdx = ORDER_INDEX[status] ?? 0;

  return (
    <View style={styles.container}>
      {isTerminal && (
        <View style={styles.terminal}>
          <View style={[styles.terminalDot, { backgroundColor: Colors.error }]} />
          <Text style={[styles.terminalLabel, { color: Colors.error }]}>
            {status === 'cancelled' ? 'Order Cancelled' : 'Order Declined'}
          </Text>
        </View>
      )}
      {steps.map((step, idx) => {
        const stepIdx = ORDER_INDEX[step.key] ?? idx;
        const isDone = stepIdx < currentIdx;
        const isCurrent = step.key === status || (stepIdx === currentIdx && !isTerminal);
        const isPending = stepIdx > currentIdx;

        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.left}>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isCurrent && styles.dotCurrent,
                  isPending && styles.dotPending,
                ]}
              >
                {isDone && <Text style={styles.check}>✓</Text>}
              </View>
              {idx < steps.length - 1 && (
                <View style={[styles.line, isDone && styles.lineDone]} />
              )}
            </View>
            <View style={styles.right}>
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  isPending && styles.stepLabelPending,
                ]}
              >
                {step.label}
              </Text>
              {timestamps?.[step.key] && (
                <Text style={styles.timestamp}>
                  {new Date(timestamps[step.key]!).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  left: {
    alignItems: 'center',
    width: 24,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.bgPrimary,
  },
  dotDone: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  dotCurrent: {
    borderColor: Colors.gold,
    backgroundColor: `${Colors.gold}33`,
  },
  dotPending: {
    borderColor: Colors.surfaceBorder,
  },
  check: {
    color: Colors.bgPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: 2,
    minHeight: 28,
  },
  lineDone: {
    backgroundColor: Colors.gold,
  },
  right: {
    flex: 1,
    paddingBottom: Spacing.base,
    justifyContent: 'center',
  },
  stepLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  stepLabelCurrent: {
    color: Colors.gold,
    fontWeight: '700',
  },
  stepLabelPending: {
    color: Colors.textDisabled,
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  terminal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
    padding: Spacing.sm,
    backgroundColor: `${Colors.error}1A`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.error}4D`,
  },
  terminalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  terminalLabel: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
});
