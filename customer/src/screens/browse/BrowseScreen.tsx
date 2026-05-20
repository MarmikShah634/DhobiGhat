import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { washermenApi, Washerman } from '../../api/washermen';
import { customersApi } from '../../api/customers';
import { WashermanCard } from '../../components/washerman/WashermanCard';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import { EmptyState } from '../../components/ui/EmptyState';

export function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [washermen, setWashermen] = useState<Washerman[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadWashermen = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    try {
      const res = await washermenApi.search({
        query: query || undefined,
        available_only: availableOnly || undefined,
        page: p,
        limit: 20,
      });
      const data = res.data.data;
      setWashermen(reset ? data : (prev) => [...prev, ...data]);
      setHasMore(data.length === 20);
      if (!reset) setPage(p + 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, availableOnly, page]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadWashermen(true);
  }, [query, availableOnly]);

  useEffect(() => {
    customersApi.getFavourites().then((res) => {
      setFavouriteIds(new Set(res.data.data?.map((w: Washerman) => w.id)));
    }).catch(() => {});
  }, []);

  const toggleFavourite = async (id: string) => {
    const isFav = favouriteIds.has(id);
    const updated = new Set(favouriteIds);
    if (isFav) { updated.delete(id); await customersApi.removeFavourite(id); }
    else { updated.add(id); await customersApi.addFavourite(id); }
    setFavouriteIds(updated);
  };

  const onRefresh = () => { setRefreshing(true); setPage(1); loadWashermen(true); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a Washerman</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or area"
            placeholderTextColor={Colors.textDisabled}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.chip, availableOnly && styles.chipActive]}
          onPress={() => setAvailableOnly((v) => !v)}
        >
          <Text style={[styles.chipText, availableOnly && styles.chipTextActive]}>
            Available Only
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.list}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={washermen}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          renderItem={({ item }) => (
            <WashermanCard
              washerman={item}
              onPress={() => navigation.navigate('WashermanProfile', { washermanId: item.id })}
              onFavouriteToggle={() => toggleFavourite(item.id)}
              isFavourite={favouriteIds.has(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="🔍" title="No washermen found" subtitle="Try clearing your filters" />
          }
          onEndReached={() => hasMore && loadWashermen()}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: Spacing.lg, gap: Spacing.sm },
  title: { ...Typography.h1, color: Colors.textPrimary },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, paddingHorizontal: Spacing.base, height: 48, borderWidth: 1, borderColor: Colors.surfaceBorder },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary },
  chip: { alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: 6 },
  chipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { ...Typography.caption, color: Colors.textSecondary },
  chipTextActive: { color: Colors.bgPrimary, fontWeight: '700' },
  list: { padding: Spacing.lg, paddingTop: 0 },
});
