import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { pricingApi } from '../../api/pricing';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface WashType { id: string; name: string; }
interface Item { id: string; name: string; }
interface GridEntry { wash_type_id: string; item_id: string; price_paise: number; }

export function PriceGridScreen() {
  const insets = useSafeAreaInsets();
  const [washTypes, setWashTypes] = useState<WashType[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [grid, setGrid] = useState<GridEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [showAddWashType, setShowAddWashType] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newWashTypeName, setNewWashTypeName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [addingWashType, setAddingWashType] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  const [editingCell, setEditingCell] = useState<{ washTypeId: string; itemId: string } | null>(null);
  const [editPrice, setEditPrice] = useState('');

  const load = useCallback(async () => {
    try {
      const [wtRes, itemRes, gridRes] = await Promise.all([
        pricingApi.listWashTypes(),
        pricingApi.listItems(),
        pricingApi.getGrid(),
      ]);
      setWashTypes(wtRes.data);
      setItems(itemRes.data);
      setGrid(gridRes.data);
    } catch { Alert.alert('Error', 'Could not load pricing data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getPrice = (washTypeId: string, itemId: string): number | null => {
    const entry = grid.find((g) => g.wash_type_id === washTypeId && g.item_id === itemId);
    return entry ? entry.price_paise : null;
  };

  const openEdit = (washTypeId: string, itemId: string) => {
    const price = getPrice(washTypeId, itemId);
    setEditPrice(price ? (price / 100).toFixed(0) : '');
    setEditingCell({ washTypeId, itemId });
  };

  const savePrice = async () => {
    if (!editingCell) return;
    const paise = Math.round(parseFloat(editPrice || '0') * 100);
    const key = `${editingCell.washTypeId}-${editingCell.itemId}`;
    setSaving(key);
    try {
      await pricingApi.upsertGrid([{ wash_type_id: editingCell.washTypeId, item_id: editingCell.itemId, price_paise: paise }]);
      setGrid((prev) => {
        const next = prev.filter((g) => !(g.wash_type_id === editingCell.washTypeId && g.item_id === editingCell.itemId));
        if (paise > 0) next.push({ wash_type_id: editingCell.washTypeId, item_id: editingCell.itemId, price_paise: paise });
        return next;
      });
    } catch { Alert.alert('Error', 'Could not save price.'); }
    finally { setSaving(null); setEditingCell(null); }
  };

  const addWashType = async () => {
    if (!newWashTypeName.trim()) return;
    setAddingWashType(true);
    try {
      await pricingApi.createWashType({ name: newWashTypeName.trim() });
      setNewWashTypeName('');
      setShowAddWashType(false);
      load();
    } catch { Alert.alert('Error', 'Could not add wash type.'); }
    finally { setAddingWashType(false); }
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      await pricingApi.createItem({ name: newItemName.trim() });
      setNewItemName('');
      setShowAddItem(false);
      load();
    } catch { Alert.alert('Error', 'Could not add item.'); }
    finally { setAddingItem(false); }
  };

  const deleteWashType = (wt: WashType) => {
    Alert.alert('Delete Wash Type', `Remove "${wt.name}"? All prices for this wash type will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await pricingApi.deleteWashType(wt.id); load(); }
        catch { Alert.alert('Error', 'Could not delete wash type.'); }
      }},
    ]);
  };

  const deleteItem = (item: Item) => {
    Alert.alert('Delete Item', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await pricingApi.deleteItem(item.id); load(); }
        catch { Alert.alert('Error', 'Could not delete item.'); }
      }},
    ]);
  };

  if (loading) return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}>
      <ActivityIndicator color={Colors.gold} size="large" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Price Grid</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddItem(true)}>
          <Text style={styles.addBtnText}>+ Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddWashType(true)}>
          <Text style={styles.addBtnText}>+ Wash Type</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 || washTypes.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🧺</Text>
          <Text style={styles.emptyTitle}>Set up your price grid</Text>
          <Text style={styles.emptySub}>Add wash types (Wash & Fold, Dry Clean…) and items (Shirt, Saree…) to get started.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ScrollView>
            <View>
              {/* Header row */}
              <View style={styles.row}>
                <View style={[styles.labelCell, styles.cornerCell]}>
                  <Text style={styles.cornerText}>Item \ Wash Type</Text>
                </View>
                {washTypes.map((wt) => (
                  <TouchableOpacity key={wt.id} style={styles.headerCell} onLongPress={() => deleteWashType(wt)}>
                    <Text style={styles.headerText} numberOfLines={2}>{wt.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <TouchableOpacity style={styles.labelCell} onLongPress={() => deleteItem(item)}>
                    <Text style={styles.labelText} numberOfLines={2}>{item.name}</Text>
                  </TouchableOpacity>
                  {washTypes.map((wt) => {
                    const price = getPrice(wt.id, item.id);
                    const key = `${wt.id}-${item.id}`;
                    return (
                      <TouchableOpacity key={wt.id} style={[styles.cell, !price && styles.cellEmpty]} onPress={() => openEdit(wt.id, item.id)}>
                        {saving === key
                          ? <ActivityIndicator color={Colors.gold} size="small" />
                          : <Text style={[styles.cellText, !price && styles.cellTextEmpty]}>{price ? `₹${(price / 100).toFixed(0)}` : '—'}</Text>
                        }
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      <View style={styles.hint}>
        <Text style={styles.hintText}>Tap a cell to set price · Long press row/column to delete</Text>
      </View>

      {/* Edit price modal */}
      <Modal visible={!!editingCell} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Set Price</Text>
            {editingCell && (
              <Text style={styles.sheetSub}>
                {items.find((i) => i.id === editingCell.itemId)?.name} ·{' '}
                {washTypes.find((w) => w.id === editingCell.washTypeId)?.name}
              </Text>
            )}
            <View style={styles.priceInputRow}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.priceInput}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.textDisabled}
                autoFocus
              />
            </View>
            <View style={styles.sheetActions}>
              <Button label="Cancel" onPress={() => setEditingCell(null)} variant="secondary" fullWidth={false} style={{ flex: 1 }} />
              <Button label="Save" onPress={savePrice} fullWidth={false} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add wash type modal */}
      <Modal visible={showAddWashType} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add Wash Type</Text>
            <Input label="Name" value={newWashTypeName} onChangeText={setNewWashTypeName} placeholder="e.g. Dry Clean" autoFocus />
            <Button label="Add" onPress={addWashType} loading={addingWashType} disabled={!newWashTypeName.trim()} />
            <TouchableOpacity onPress={() => setShowAddWashType(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add item modal */}
      <Modal visible={showAddItem} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add Item</Text>
            <Input label="Name" value={newItemName} onChangeText={setNewItemName} placeholder="e.g. Shirt" autoFocus />
            <Button label="Add" onPress={addItem} loading={addingItem} disabled={!newItemName.trim()} />
            <TouchableOpacity onPress={() => setShowAddItem(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CELL_W = 90;
const LABEL_W = 110;
const CELL_H = 52;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  titleRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  title: { ...Typography.h1, color: Colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.base },
  addBtn: { borderWidth: 1, borderColor: Colors.gold, borderRadius: Radius.full, paddingHorizontal: Spacing.base, paddingVertical: 6 },
  addBtnText: { ...Typography.caption, color: Colors.gold, fontWeight: '700' },
  row: { flexDirection: 'row' },
  cornerCell: { backgroundColor: Colors.bgSecondary, justifyContent: 'flex-end', alignItems: 'flex-start' },
  cornerText: { ...Typography.caption, color: Colors.textDisabled, fontSize: 10 },
  headerCell: { width: CELL_W, height: CELL_H, backgroundColor: Colors.bgSecondary, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: Colors.surfaceBorder, padding: 4 },
  headerText: { ...Typography.caption, color: Colors.gold, textAlign: 'center', fontWeight: '700' },
  labelCell: { width: LABEL_W, height: CELL_H, backgroundColor: Colors.bgSecondary, justifyContent: 'center', paddingHorizontal: 8, borderWidth: 0.5, borderColor: Colors.surfaceBorder },
  labelText: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '600' },
  cell: { width: CELL_W, height: CELL_H, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: Colors.surfaceBorder },
  cellEmpty: { backgroundColor: `${Colors.bgSecondary}80` },
  cellText: { ...Typography.bodyMedium, color: Colors.gold, fontWeight: '700' },
  cellTextEmpty: { color: Colors.textDisabled, fontSize: 18 },
  hint: { paddingVertical: Spacing.sm, alignItems: 'center', borderTopWidth: 1, borderColor: Colors.surfaceBorder },
  hintText: { ...Typography.caption, color: Colors.textDisabled },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.base },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center' },
  sheet: { backgroundColor: Colors.bgSecondary, borderRadius: 20, padding: Spacing.xl, gap: Spacing.base, width: '85%' },
  sheetTitle: { ...Typography.h3, color: Colors.textPrimary },
  sheetSub: { ...Typography.body, color: Colors.textSecondary },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgPrimary, borderRadius: Radius.base, borderWidth: 1.5, borderColor: Colors.gold, paddingHorizontal: Spacing.base },
  rupeeSign: { ...Typography.h2, color: Colors.gold },
  priceInput: { ...Typography.h2, color: Colors.textPrimary, flex: 1, paddingVertical: Spacing.base },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm },
  cancelText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
