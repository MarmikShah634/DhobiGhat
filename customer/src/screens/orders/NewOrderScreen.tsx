import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { pricingApi, WashType, PriceItem, PriceGridEntry } from '../../api/pricing';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface SelectedItem {
  price_grid_id: string;
  item_name: string;
  wash_type_name: string;
  quantity: number;
  unit_price_paise: number;
}

export function NewOrderScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { customer } = useAuthStore();
  const [deliveryMode, setDeliveryMode] = useState<'door_to_door' | 'drop_off'>('door_to_door');
  const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [grid, setGrid] = useState<{ wash_types: WashType[]; items: PriceItem[]; grid: PriceGridEntry[] } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    if (customer?.selected_washerman_id) {
      pricingApi.getGrid(customer.selected_washerman_id).then((r) => setGrid(r.data)).catch(() => {});
    }
  }, [customer?.selected_washerman_id]);

  const getPrice = (itemId: string, washTypeId: string) =>
    grid?.grid.find((g) => g.price_item_id === itemId && g.wash_type_id === washTypeId);

  const toggleItem = (entry: PriceGridEntry, itemName: string, washTypeName: string) => {
    const key = entry.id;
    const updated = { ...selectedItems };
    if (updated[key]) {
      delete updated[key];
    } else {
      updated[key] = {
        price_grid_id: entry.id,
        item_name: itemName,
        wash_type_name: washTypeName,
        quantity: 1,
        unit_price_paise: entry.price_paise,
      };
    }
    setSelectedItems(updated);
  };

  const updateQty = (key: string, delta: number) => {
    const updated = { ...selectedItems };
    const newQty = (updated[key].quantity ?? 1) + delta;
    if (newQty < 1) { delete updated[key]; }
    else { updated[key] = { ...updated[key], quantity: newQty }; }
    setSelectedItems(updated);
  };

  const total = Object.values(selectedItems).reduce(
    (sum, i) => sum + i.unit_price_paise * i.quantity, 0,
  );

  const handleReview = () => {
    if (!customer?.selected_washerman_id) {
      Alert.alert('No washerman selected', 'Please select a washerman first.');
      return;
    }
    if (Object.keys(selectedItems).length === 0) {
      Alert.alert('No items', 'Please add at least one item to your order.');
      return;
    }
    navigation.navigate('OrderConfirm', {
      washermanId: customer.selected_washerman_id,
      deliveryMode,
      pickupDate: pickupDate.toISOString().split('T')[0],
      items: Object.values(selectedItems),
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Order</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View>
          <Text style={styles.label}>Delivery Mode</Text>
          <View style={styles.segmented}>
            {(['door_to_door', 'drop_off'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.segment, deliveryMode === mode && styles.segmentActive]}
                onPress={() => setDeliveryMode(mode)}
              >
                <Text style={[styles.segmentText, deliveryMode === mode && styles.segmentTextActive]}>
                  {mode === 'door_to_door' ? '🚪 Door to Door' : '📦 Drop Off'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.label}>📅 Pickup Date</Text>
          <Text style={styles.dateValue}>{pickupDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, date) => { setShowDatePicker(Platform.OS === 'ios'); if (date) setPickupDate(date); }}
          />
        )}

        {grid && (
          <View>
            <Text style={styles.sectionTitle}>Select Items</Text>
            {grid.items.map((item) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                >
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={styles.chevron}>{expandedItem === item.id ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {expandedItem === item.id && (
                  <View style={styles.washTypes}>
                    {grid.wash_types.map((wt) => {
                      const entry = getPrice(item.id, wt.id);
                      if (!entry) return null;
                      const key = entry.id;
                      const sel = selectedItems[key];
                      return (
                        <View key={wt.id} style={styles.wtRow}>
                          <TouchableOpacity
                            style={[styles.wtChip, sel && styles.wtChipActive]}
                            onPress={() => toggleItem(entry, item.item_name, wt.name)}
                          >
                            <Text style={[styles.wtText, sel && styles.wtTextActive]}>{wt.name}</Text>
                            <Text style={[styles.wtPrice, sel && styles.wtTextActive]}>₹{(entry.price_paise / 100).toFixed(0)}</Text>
                          </TouchableOpacity>
                          {sel && (
                            <View style={styles.qty}>
                              <TouchableOpacity onPress={() => updateQty(key, -1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                              <Text style={styles.qtyNum}>{sel.quantity}</Text>
                              <TouchableOpacity onPress={() => updateQty(key, 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {Object.keys(selectedItems).length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>{Object.values(selectedItems).reduce((s, i) => s + i.quantity, 0)} items</Text>
            <Text style={styles.footerTotal}>₹{(total / 100).toFixed(2)}</Text>
          </View>
          <Button label="Review Order" onPress={handleReview} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: Spacing.lg, gap: Spacing.sm },
  back: { ...Typography.body, color: Colors.gold },
  title: { ...Typography.h1, color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.base, paddingBottom: 120 },
  label: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: 6 },
  segmented: { flexDirection: 'row', backgroundColor: Colors.bgSecondary, borderRadius: Radius.base, padding: 4, borderWidth: 1, borderColor: Colors.surfaceBorder },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  segmentActive: { backgroundColor: Colors.gold },
  segmentText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  segmentTextActive: { color: Colors.bgPrimary, fontWeight: '700' },
  datePicker: { backgroundColor: Colors.bgSecondary, borderRadius: Radius.base, padding: Spacing.base, borderWidth: 1, borderColor: Colors.surfaceBorder },
  dateValue: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '600', marginTop: 4 },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, backgroundColor: Colors.bgSecondary, borderRadius: Radius.base, marginBottom: 4, borderWidth: 1, borderColor: Colors.surfaceBorder },
  itemName: { ...Typography.bodyLarge, color: Colors.textPrimary },
  chevron: { color: Colors.textSecondary },
  washTypes: { paddingLeft: Spacing.base, marginBottom: Spacing.sm, gap: 8 },
  wtRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  wtChip: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: 6 },
  wtChipActive: { backgroundColor: `${Colors.gold}1A`, borderColor: Colors.gold },
  wtText: { ...Typography.body, color: Colors.textSecondary },
  wtTextActive: { color: Colors.gold },
  wtPrice: { ...Typography.bodyMedium, color: Colors.textDisabled },
  qty: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.gold },
  qtyBtnText: { color: Colors.gold, fontSize: 18, fontWeight: '700' },
  qtyNum: { ...Typography.bodyLarge, color: Colors.textPrimary, minWidth: 24, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.bgPrimary, borderTopWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.sm },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { ...Typography.body, color: Colors.textSecondary },
  footerTotal: { ...Typography.h3, color: Colors.gold },
});
