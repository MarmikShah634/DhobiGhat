import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { reviewsApi } from '../../api/reviews';
import { Card } from '../../components/ui/Card';

interface Review { id: string; customer_name: string; rating: number; comment?: string; created_at: string; }

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: 14, color: s <= rating ? Colors.gold : Colors.textDisabled }}>★</Text>
      ))}
    </View>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? count / total : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}><View style={[styles.barFill, { flex: pct }]} /></View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

export function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewsApi.getMyReviews()
      .then((r) => setReviews(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={reviews.length > 0 ? (
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.avgWrap}>
                  <Text style={styles.avgNum}>{avg.toFixed(1)}</Text>
                  <Stars rating={Math.round(avg)} />
                  <Text style={styles.reviewCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.barsWrap}>
                  {counts.map(({ star, count }) => (
                    <RatingBar key={star} label={`${star}★`} count={count} total={reviews.length} />
                  ))}
                </View>
              </View>
            </Card>
          ) : null}
          renderItem={({ item }) => (
            <Card style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{item.customer_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>{item.customer_name}</Text>
                  <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Stars rating={item.rating} />
              </View>
              {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySub}>Reviews from customers will appear here</Text>
            </View>
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
  summaryCard: { marginBottom: Spacing.base },
  summaryRow: { flexDirection: 'row', gap: Spacing.lg },
  avgWrap: { alignItems: 'center', gap: 4 },
  avgNum: { ...Typography.h1, color: Colors.gold },
  reviewCount: { ...Typography.caption, color: Colors.textSecondary },
  barsWrap: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barLabel: { ...Typography.caption, color: Colors.textSecondary, width: 24, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.surfaceBorder, borderRadius: 3, flexDirection: 'row' },
  barFill: { height: 6, backgroundColor: Colors.gold, borderRadius: 3 },
  barCount: { ...Typography.caption, color: Colors.textSecondary, width: 20 },
  reviewCard: {},
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${Colors.gold}33`, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { ...Typography.bodyMedium, color: Colors.gold, fontWeight: '700' },
  reviewerName: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600' },
  reviewDate: { ...Typography.caption, color: Colors.textSecondary },
  comment: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: Spacing.base },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
