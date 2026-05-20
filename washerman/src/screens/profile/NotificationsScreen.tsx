import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { notificationsApi } from '../../api/notifications';

interface Notification { id: string; title: string; body: string; is_read: boolean; order_id?: string; created_at: string; }

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationsApi.list()
      .then((r) => setNotifications(r.data.data ?? r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handlePress = (n: Notification) => {
    markRead(n.id);
    if (n.order_id) navigation.navigate('Orders', { screen: 'OrderDetail', params: { orderId: n.order_id } });
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handlePress(item)}>
              <View style={[styles.item, !item.is_read && styles.itemUnread]}>
                {!item.is_read && <View style={styles.unreadBar} />}
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemBody}>{item.body}</Text>
                  <Text style={styles.itemTime}>{formatTime(item.created_at)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptySub}>No notifications yet</Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...Typography.h2, color: Colors.textPrimary },
  markAll: { ...Typography.caption, color: Colors.gold, fontWeight: '700' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
  itemUnread: { backgroundColor: `${Colors.gold}0D` },
  unreadBar: { width: 4, borderRadius: 2, backgroundColor: Colors.gold, marginRight: Spacing.sm },
  itemContent: { flex: 1, gap: 2 },
  itemTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600' },
  itemBody: { ...Typography.body, color: Colors.textSecondary },
  itemTime: { ...Typography.caption, color: Colors.textDisabled, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: Spacing.base },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySub: { ...Typography.body, color: Colors.textSecondary },
});
