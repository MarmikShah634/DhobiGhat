import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { ordersApi, Order } from '../../api/orders';
import { reviewsApi } from '../../api/reviews';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatusTimeline } from '../../components/order/StatusTimeline';
import { OTPInput } from '../../components/ui/OTPInput';

type Props = NativeStackScreenProps<any, any>;

export function OrderDetailScreen({ route }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const res = await ordersApi.get(orderId);
      setOrder(res.data);
    } catch {
      Alert.alert('Error', 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const handleCancel = async () => {
    Alert.alert('Cancel Order?', 'This action cannot be undone.', [
      { text: 'Keep Order', style: 'cancel' },
      {
        text: 'Cancel Order', style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const res = await ordersApi.cancel(orderId);
            setOrder(res.data);
          } catch {
            Alert.alert('Error', 'Could not cancel order.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleConfirmCollection = async () => {
    setConfirming(true);
    try {
      const res = await ordersApi.confirmCollection(orderId);
      setOrder(res.data);
      setShowCollectionModal(false);
    } catch {
      Alert.alert('Error', 'Could not confirm collection.');
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await reviewsApi.submit({ order_id: orderId, rating, review_text: reviewText || undefined });
      setShowReviewModal(false);
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch {
      Alert.alert('Error', 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!order) return null;

  const canCancel = ['pending', 'accepted'].includes(order.status);
  const canConfirm = order.status === 'collecting' && !order.customer_collected_confirmed;
  const canReview = order.status === 'delivered';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.orderNum}>{order.order_number}</Text>
          <StatusBadge status={order.status} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.sectionLabel}>Status</Text>
          <StatusTimeline status={order.status} deliveryMode={order.delivery_mode} />
        </Card>

        <Card>
          <Text style={styles.sectionLabel}>Delivery Info</Text>
          <Text style={styles.value}>
            {order.delivery_mode === 'door_to_door' ? '🚪 Door to Door' : '📦 Drop Off'}
          </Text>
          <Text style={styles.value}>
            📅 {new Date(order.pickup_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
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
          <Text style={[styles.paymentStatus, { color: order.is_paid ? Colors.success : Colors.warning }]}>
            {order.is_paid ? '✓ Paid' : `Unpaid · ₹${(order.total_paise / 100).toFixed(2)}`}
          </Text>
        </Card>

        {order.decline_reason && (
          <View style={styles.declineCard}>
            <Text style={styles.declineLabel}>Decline Reason</Text>
            <Text style={styles.declineText}>{order.decline_reason}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {canCancel && (
          <Button label="Cancel Order" onPress={handleCancel} variant="destructive" loading={cancelling} />
        )}
        {canConfirm && (
          <Button label="Confirm Collection" onPress={() => setShowCollectionModal(true)} />
        )}
        {canReview && (
          <Button label="Leave a Review" onPress={() => setShowReviewModal(true)} />
        )}
      </View>

      <Modal visible={showCollectionModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayIcon}>🚪</Text>
            <Text style={styles.overlayTitle}>Your washerman has arrived!</Text>
            <Text style={styles.overlaySubtitle}>
              {order.washerman?.business_name} is ready to collect your clothes.
            </Text>
            <Button label="Confirm Collection" onPress={handleConfirmCollection} loading={confirming} />
            <TouchableOpacity onPress={() => setShowCollectionModal(false)}>
              <Text style={styles.overlayDismiss}>Not yet — I'll confirm later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.reviewSheet}>
            <Text style={styles.reviewTitle}>How was your experience?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button label="Submit Review" onPress={handleSubmitReview} disabled={rating === 0} loading={submitting} />
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Text style={styles.overlayDismiss}>Maybe later</Text>
            </TouchableOpacity>
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
  value: { ...Typography.bodyLarge, color: Colors.textPrimary, marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  itemName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  itemSub: { ...Typography.caption, color: Colors.textSecondary },
  itemQty: { ...Typography.body, color: Colors.textSecondary },
  itemPrice: { ...Typography.bodyMedium, color: Colors.gold, minWidth: 64, textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...Typography.h4, color: Colors.textPrimary },
  totalValue: { ...Typography.h3, color: Colors.gold },
  paymentStatus: { ...Typography.bodyLarge, fontWeight: '700' },
  declineCard: { backgroundColor: `${Colors.error}1A`, borderRadius: 12, padding: Spacing.base, borderWidth: 1, borderColor: `${Colors.error}4D` },
  declineLabel: { ...Typography.caption, color: Colors.error, fontWeight: '700', marginBottom: 4 },
  declineText: { ...Typography.body, color: Colors.error },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.bgPrimary, borderTopWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.sm },
  overlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  overlayCard: { backgroundColor: Colors.bgSecondary, borderRadius: 24, padding: Spacing.xl, width: '100%', alignItems: 'center', gap: Spacing.base },
  overlayIcon: { fontSize: 56 },
  overlayTitle: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center' },
  overlaySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  overlayDismiss: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  reviewSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, gap: Spacing.base },
  reviewTitle: { ...Typography.h3, color: Colors.textPrimary, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  star: { fontSize: 40, color: Colors.textDisabled },
  starActive: { color: Colors.gold },
});
