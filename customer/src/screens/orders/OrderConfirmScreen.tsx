import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type Props = NativeStackScreenProps<any, any>;

interface ItemParam {
  price_grid_id: string;
  item_name: string;
  wash_type_name: string;
  quantity: number;
  unit_price_paise: number;
}

export function OrderConfirmScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { washermanId, deliveryMode, pickupDate, items } = route.params as {
    washermanId: string;
    deliveryMode: 'door_to_door' | 'drop_off';
    pickupDate: string;
    items: ItemParam[];
  };
  const [loading, setLoading] = useState(false);

  const total = items.reduce((s: number, i: ItemParam) => s + i.unit_price_paise * i.quantity, 0);

  const handlePlace = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.create({
        washerman_id: washermanId,
        delivery_mode: deliveryMode,
        pickup_date: pickupDate,
        items: items.map((i: ItemParam) => ({ price_grid_id: i.price_grid_id, quantity: i.quantity })),
      });
      navigation.replace('OrderDetail', { orderId: res.data.id });
    } catch {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Order</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.sectionLabel}>Delivery</Text>
          <Text style={styles.value}>
            {deliveryMode === 'door_to_door' ? '🚪 Door to Door' : '📦 Drop Off'} · {new Date(pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionLabel}>Items</Text>
          {items.map((item: ItemParam, i: number) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemSub}>{item.wash_type_name}</Text>
              </View>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{((item.unit_price_paise * item.quantity) / 100).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{(total / 100).toFixed(2)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="Place Order" onPress={handlePlace} loading={loading} />
        <Text style={styles.disclaimer}>Order is subject to washerman approval</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: Spacing.lg, gap: Spacing.sm },
  back: { ...Typography.body, color: Colors.gold },
  title: { ...Typography.h1, color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.base, paddingBottom: 120 },
  sectionLabel: { ...Typography.caption, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  value: { ...Typography.bodyLarge, color: Colors.textPrimary },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  itemName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  itemSub: { ...Typography.caption, color: Colors.textSecondary },
  itemQty: { ...Typography.body, color: Colors.textSecondary },
  itemPrice: { ...Typography.bodyMedium, color: Colors.gold, minWidth: 64, textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...Typography.h4, color: Colors.textPrimary },
  totalValue: { ...Typography.h3, color: Colors.gold },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.bgPrimary, borderTopWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.sm },
  disclaimer: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
});
