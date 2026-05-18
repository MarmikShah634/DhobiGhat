import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius, Size } from '../../theme/spacing';
import { washermenApi, Washerman } from '../../api/washermen';
import { pricingApi, WashType, PriceItem, PriceGridEntry } from '../../api/pricing';
import { reviewsApi, Review } from '../../api/reviews';
import { customersApi } from '../../api/customers';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';

type Props = NativeStackScreenProps<any, any>;

export function WashermanProfileScreen({ route, navigation }: Props) {
  const { washermanId } = route.params;
  const insets = useSafeAreaInsets();
  const { customer, setCustomer } = useAuthStore();
  const [washerman, setWasherman] = useState<Washerman | null>(null);
  const [grid, setGrid] = useState<{ wash_types: WashType[]; items: PriceItem[]; grid: PriceGridEntry[] } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  const isSelected = customer?.selected_washerman_id === washermanId;

  useEffect(() => {
    Promise.all([
      washermenApi.getById(washermanId),
      pricingApi.getGrid(washermanId),
      reviewsApi.getForWasherman(washermanId),
      customersApi.getFavourites(),
    ]).then(([wRes, gRes, rRes, fRes]) => {
      setWasherman(wRes.data);
      setGrid(gRes.data);
      setReviews(rRes.data.data ?? []);
      const ids: string[] = (fRes.data.data ?? []).map((w: Washerman) => w.id);
      setIsFav(ids.includes(washermanId));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [washermanId]);

  const handleSelect = async () => {
    if (isSelected) return;
    if (customer?.selected_washerman_id) {
      Alert.alert(
        `Switch to ${washerman?.business_name}?`,
        'Your future orders will go to this washerman. Past orders are unaffected.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch', onPress: doSelect },
        ],
      );
    } else {
      doSelect();
    }
  };

  const doSelect = async () => {
    setSelecting(true);
    try {
      await customersApi.selectWasherman(washermanId);
      if (customer) setCustomer({ ...customer, selected_washerman_id: washermanId });
    } catch {
      Alert.alert('Error', 'Could not select washerman.');
    } finally {
      setSelecting(false);
    }
  };

  const toggleFav = async () => {
    try {
      if (isFav) await customersApi.removeFavourite(washermanId);
      else await customersApi.addFavourite(washermanId);
      setIsFav((v) => !v);
    } catch {}
  };

  const getPrice = (itemId: string, washTypeId: string) => {
    const entry = grid?.grid.find(
      (g) => g.price_item_id === itemId && g.wash_type_id === washTypeId,
    );
    return entry ? `₹${(entry.price_paise / 100).toFixed(0)}` : '—';
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!washerman) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <LinearGradient colors={['#0F1F3D', '#162952']} style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartBtn} onPress={toggleFav}>
            <Text style={{ fontSize: 24, color: isFav ? Colors.error : Colors.textSecondary }}>
              {isFav ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{washerman.business_name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.bizName}>{washerman.business_name}</Text>
          <Text style={styles.area}>{washerman.area}</Text>
          <View style={styles.availability}>
            <View style={[styles.dot, { backgroundColor: washerman.is_available ? Colors.success : Colors.textDisabled }]} />
            <Text style={[styles.availText, { color: washerman.is_available ? Colors.success : Colors.textDisabled }]}>
              {washerman.is_available ? 'Open' : 'Closed'}
            </Text>
          </View>
          <Text style={styles.rating}>
            {'★'.repeat(Math.round(washerman.avg_rating))} {washerman.avg_rating.toFixed(1)} · {washerman.review_count} reviews
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {grid && grid.items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price List</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tableRow}>
                    <View style={styles.itemCell}><Text style={styles.headerCell}>Item</Text></View>
                    {grid.wash_types.map((wt) => (
                      <View key={wt.id} style={styles.priceCell}>
                        <Text style={styles.headerCell}>{wt.name}</Text>
                      </View>
                    ))}
                  </View>
                  {grid.items.map((item) => (
                    <View key={item.id} style={styles.tableRow}>
                      <View style={styles.itemCell}><Text style={styles.itemText}>{item.item_name}</Text></View>
                      {grid.wash_types.map((wt) => (
                        <View key={wt.id} style={styles.priceCell}>
                          <Text style={styles.priceText}>{getPrice(item.id, wt.id)}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              {reviews.slice(0, 5).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewInitial}>C</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                      <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                    </View>
                  </View>
                  {r.review_text && <Text style={styles.reviewText}>{r.review_text}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          label={isSelected ? '✓ Currently Selected' : `Select ${washerman.business_name}`}
          onPress={handleSelect}
          loading={selecting}
          variant={isSelected ? 'secondary' : 'primary'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  hero: { padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.xl },
  backBtn: { alignSelf: 'flex-start', marginBottom: Spacing.sm },
  backText: { ...Typography.body, color: Colors.gold },
  heartBtn: { position: 'absolute', top: 60, right: Spacing.lg },
  avatar: { width: Size.avatarXl, height: Size.avatarXl, borderRadius: Size.avatarXl / 2, backgroundColor: `${Colors.gold}33`, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.gold },
  avatarText: { ...Typography.h1, color: Colors.gold },
  bizName: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center' },
  area: { ...Typography.body, color: Colors.textSecondary },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  availText: { ...Typography.body, fontWeight: '600' },
  rating: { ...Typography.body, color: Colors.gold },
  body: { padding: Spacing.lg, gap: Spacing.xl },
  section: { gap: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: Colors.surfaceBorder },
  itemCell: { width: 120, padding: Spacing.sm },
  priceCell: { width: 80, padding: Spacing.sm, alignItems: 'center' },
  headerCell: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  itemText: { ...Typography.body, color: Colors.textPrimary },
  priceText: { ...Typography.bodyMedium, color: Colors.gold },
  reviewCard: { backgroundColor: Colors.bgSecondary, borderRadius: Radius.card, padding: Spacing.base, gap: Spacing.sm, borderWidth: 1, borderColor: `${Colors.gold}33` },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${Colors.gold}33`, alignItems: 'center', justifyContent: 'center' },
  reviewInitial: { ...Typography.bodyMedium, color: Colors.gold, fontWeight: '700' },
  reviewStars: { color: Colors.gold, fontSize: 13 },
  reviewDate: { ...Typography.caption, color: Colors.textSecondary },
  reviewText: { ...Typography.body, color: Colors.textSecondary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.bgPrimary, borderTopWidth: 1, borderColor: Colors.surfaceBorder },
});
