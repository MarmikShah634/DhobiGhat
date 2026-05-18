import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { customersApi } from '../../api/customers';
import { Washerman } from '../../api/washermen';
import { WashermanCard } from '../../components/washerman/WashermanCard';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import { EmptyState } from '../../components/ui/EmptyState';

export function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [favourites, setFavourites] = useState<Washerman[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await customersApi.getFavourites();
      setFavourites(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeFavourite = async (id: string) => {
    await customersApi.removeFavourite(id);
    setFavourites((prev) => prev.filter((w) => w.id !== id));
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favourites</Text>
        {favourites.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{favourites.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ padding: Spacing.lg }}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <FlatList
          data={favourites}
          keyExtractor={(w) => w.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          renderItem={({ item }) => (
            <WashermanCard
              washerman={item}
              onPress={() => navigation.navigate('Browse', { screen: 'WashermanProfile', params: { washermanId: item.id } })}
              onFavouriteToggle={() => removeFavourite(item.id)}
              isFavourite
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="♡"
              title="No favourites yet"
              subtitle="Browse washermen and tap ♥ to save them here"
              actionLabel="Browse Now"
              onAction={() => navigation.navigate('Browse')}
            />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg },
  title: { ...Typography.h1, color: Colors.textPrimary },
  badge: { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { ...Typography.caption, color: Colors.bgPrimary, fontWeight: '700' },
  list: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 32 },
});
