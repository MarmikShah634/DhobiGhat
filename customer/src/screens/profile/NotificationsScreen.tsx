import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { notificationsApi, Notification } from '../../api/notifications';
import { useNotificationStore } from '../../store/notificationStore';
import { EmptyState } from '../../components/ui/EmptyState';

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { notifications, setNotifications, markRead, markAllRead } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ limit: 50 });
      setNotifications(res.data.data);
    } catch {} finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    markRead(id);
    await notificationsApi.markRead(id);
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    await notificationsApi.markAllRead();
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAll}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: Notification }) => (
          <TouchableOpacity
            style={[styles.item, !item.is_read && styles.itemUnread]}
            onPress={() => {
              handleMarkRead(item.id);
              if (item.order_id) {
                navigation.navigate('Home', { screen: 'OrderDetail', params: { orderId: item.order_id } });
              }
            }}
          >
            {!item.is_read && <View style={styles.unreadBar} />}
            <View style={styles.itemContent}>
              <View style={styles.itemRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemTime}>{timeAgo(item.sent_at)}</Text>
              </View>
              <Text style={styles.itemBody}>{item.body}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState icon="🔔" title="All caught up!" subtitle="No notifications yet" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
  back: { ...Typography.body, color: Colors.gold },
  title: { ...Typography.h2, color: Colors.textPrimary, flex: 1 },
  markAll: { ...Typography.body, color: Colors.gold },
  list: { paddingBottom: 32 },
  item: { flexDirection: 'row', padding: Spacing.base, borderBottomWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: '#162952' },
  itemUnread: { backgroundColor: '#0F2040' },
  unreadBar: { width: 3, backgroundColor: Colors.gold, borderRadius: 2, marginRight: Spacing.sm },
  itemContent: { flex: 1, gap: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600', flex: 1 },
  itemTime: { ...Typography.caption, color: Colors.textSecondary },
  itemBody: { ...Typography.body, color: Colors.textSecondary },
});
