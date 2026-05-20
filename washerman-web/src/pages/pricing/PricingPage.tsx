import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { pricingApi, type WashType, type PricingItem, type GridEntry } from '@/api/pricing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise } from '@/lib/utils';
import toast from 'react-hot-toast';

export function PricingPage() {
  const [washTypes, setWashTypes] = useState<WashType[]>([]);
  const [items, setItems] = useState<PricingItem[]>([]);
  const [grid, setGrid] = useState<GridEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [editCell, setEditCell] = useState<{ washTypeId: string; itemId: string } | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const [addWTOpen, setAddWTOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [wtRes, iRes, gRes] = await Promise.all([pricingApi.listWashTypes(), pricingApi.listItems(), pricingApi.getGrid()]);
      setWashTypes(wtRes.data); setItems(iRes.data); setGrid(gRes.data);
    } catch { toast.error('Could not load pricing data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getPrice = (washTypeId: string, itemId: string) => grid.find((g) => g.wash_type_id === washTypeId && g.item_id === itemId)?.price_paise ?? null;

  const openEdit = (washTypeId: string, itemId: string) => {
    const p = getPrice(washTypeId, itemId);
    setEditPrice(p ? String(Math.round(p / 100)) : '');
    setEditCell({ washTypeId, itemId });
  };

  const savePrice = async () => {
    if (!editCell) return;
    const paise = Math.round(parseFloat(editPrice || '0') * 100);
    const key = `${editCell.washTypeId}-${editCell.itemId}`;
    setSavingCell(key);
    try {
      await pricingApi.upsertGrid([{ wash_type_id: editCell.washTypeId, item_id: editCell.itemId, price_paise: paise }]);
      setGrid((prev) => {
        const next = prev.filter((g) => !(g.wash_type_id === editCell.washTypeId && g.item_id === editCell.itemId));
        if (paise > 0) next.push({ wash_type_id: editCell.washTypeId, item_id: editCell.itemId, price_paise: paise });
        return next;
      });
      setEditCell(null);
    } catch { toast.error('Could not save price'); }
    finally { setSavingCell(null); }
  };

  const addWashType = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try { await pricingApi.createWashType({ name: newName.trim() }); setNewName(''); setAddWTOpen(false); load(); }
    catch { toast.error('Could not add wash type'); }
    finally { setAdding(false); }
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try { await pricingApi.createItem({ name: newName.trim() }); setNewName(''); setAddItemOpen(false); load(); }
    catch { toast.error('Could not add item'); }
    finally { setAdding(false); }
  };

  const deleteWashType = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}"? All prices for this wash type will be deleted.`)) return;
    try { await pricingApi.deleteWashType(id); load(); }
    catch { toast.error('Could not delete'); }
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    try { await pricingApi.deleteItem(id); load(); }
    catch { toast.error('Could not delete'); }
  };

  if (loading) return <PageSpinner />;

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Price Grid</h1>
          <p className="text-text-secondary text-sm mt-1">Set prices for each item × wash type combination</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => { setNewName(''); setAddItemOpen(true); }}><Plus className="w-4 h-4" /> Item</Button>
          <Button variant="secondary" size="sm" onClick={() => { setNewName(''); setAddWTOpen(true); }}><Plus className="w-4 h-4" /> Wash Type</Button>
        </div>
      </div>

      {items.length === 0 || washTypes.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-12">
          <span className="text-5xl">🧺</span>
          <h3 className="text-lg font-bold text-text-primary">Build your price grid</h3>
          <p className="text-text-secondary text-sm text-center">Add wash types (Wash & Fold, Dry Clean…) and items (Shirt, Saree…) to get started</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header */}
            <div className="flex">
              <div className="w-36 shrink-0 px-3 py-2.5 text-xs text-text-disabled">Item \ Wash Type</div>
              {washTypes.map((wt) => (
                <div key={wt.id} className="w-28 shrink-0 px-3 py-2.5 text-center">
                  <p className="text-xs font-bold text-gold">{wt.name}</p>
                  <button onClick={() => deleteWashType(wt.id, wt.name)} className="text-text-disabled hover:text-error transition-colors mt-1"><Trash2 className="w-3 h-3 mx-auto" /></button>
                </div>
              ))}
            </div>

            {/* Rows */}
            {items.map((item, ri) => (
              <div key={item.id} className={`flex ${ri % 2 === 0 ? '' : 'bg-surface-hover/30'} rounded-xl`}>
                <div className="w-36 shrink-0 px-3 py-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate flex-1">{item.name}</span>
                  <button onClick={() => deleteItem(item.id, item.name)} className="text-text-disabled hover:text-error transition-colors shrink-0"><Trash2 className="w-3 h-3" /></button>
                </div>
                {washTypes.map((wt) => {
                  const p = getPrice(wt.id, item.id);
                  const key = `${wt.id}-${item.id}`;
                  return (
                    <button key={wt.id} onClick={() => openEdit(wt.id, item.id)}
                      className="w-28 shrink-0 px-3 py-3 text-center hover:bg-gold-muted rounded-lg transition-colors group">
                      {savingCell === key ? <span className="text-xs text-text-disabled animate-pulse">saving…</span>
                        : p ? <span className="text-sm font-bold text-gold">{formatPaise(p)}</span>
                        : <span className="text-text-disabled group-hover:text-gold transition-colors">—</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-text-disabled text-center">Click any cell to set a price · Click 🗑 to delete a row or column</p>

      {/* Edit price modal */}
      <Modal open={!!editCell} onClose={() => setEditCell(null)} title="Set Price">
        {editCell && (
          <div className="flex flex-col gap-4">
            <p className="text-text-secondary text-sm">
              {items.find((i) => i.id === editCell.itemId)?.name} · {washTypes.find((w) => w.id === editCell.washTypeId)?.name}
            </p>
            <div className="flex items-center gap-3 bg-bg-primary border-2 border-gold rounded-xl px-4">
              <span className="text-xl font-bold text-gold">₹</span>
              <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" min="0" step="1" placeholder="0" autoFocus
                className="flex-1 bg-transparent py-3 text-2xl font-bold text-text-primary focus:outline-none" />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setEditCell(null)}>Cancel</Button>
              <Button fullWidth onClick={savePrice} loading={!!savingCell}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Wash Type modal */}
      <Modal open={addWTOpen} onClose={() => setAddWTOpen(false)} title="Add Wash Type">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Dry Clean" autoFocus />
          <Button fullWidth onClick={addWashType} loading={adding} disabled={!newName.trim()}>Add</Button>
        </div>
      </Modal>

      {/* Add Item modal */}
      <Modal open={addItemOpen} onClose={() => setAddItemOpen(false)} title="Add Item">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Shirt" autoFocus />
          <Button fullWidth onClick={addItem} loading={adding} disabled={!newName.trim()}>Add</Button>
        </div>
      </Modal>
    </motion.div>
  );
}
