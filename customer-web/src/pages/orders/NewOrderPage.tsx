import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { pricingApi, type PricingGrid, type WashType, type PricingItem } from '@/api/pricing';
import { ordersApi } from '@/api/orders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LineItem { item: PricingItem; washType: WashType; quantity: number; pricePaise: number; }

export function NewOrderPage() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const [grid, setGrid] = useState<PricingGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'door_to_door' | 'drop_off'>('door_to_door');
  const [pickupDate, setPickupDate] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!customer?.washerman_id) { navigate('/browse'); return; }
    pricingApi.getGrid(customer.washerman_id)
      .then((r) => setGrid(r.data))
      .catch(() => toast.error('Could not load pricing'))
      .finally(() => setLoading(false));
    const today = new Date(); today.setDate(today.getDate() + 1);
    setPickupDate(today.toISOString().split('T')[0]);
  }, [customer, navigate]);

  const getPrice = (itemId: string, washTypeId: string) => grid?.grid.find((g) => g.item_id === itemId && g.wash_type_id === washTypeId)?.price_paise ?? 0;

  const addLine = (item: PricingItem, washType: WashType) => {
    const p = getPrice(item.id, washType.id);
    if (!p) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id && l.washType.id === washType.id);
      if (existing) return prev.map((l) => l.item.id === item.id && l.washType.id === washType.id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { item, washType, quantity: 1, pricePaise: p }];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l).filter((l) => l.quantity > 0));
  };

  const total = lines.reduce((s, l) => s + l.pricePaise * l.quantity, 0);

  const placeOrder = async () => {
    if (!customer?.washerman_id || lines.length === 0 || !pickupDate) return;
    setPlacing(true);
    try {
      const res = await ordersApi.create({
        washerman_id: customer.washerman_id,
        delivery_mode: mode,
        pickup_date: pickupDate,
        items: lines.map((l) => ({ item_id: l.item.id, wash_type_id: l.washType.id, quantity: l.quantity })),
      });
      toast.success('Order placed!');
      navigate(`/orders/${res.data.id}`);
    } catch { toast.error('Could not place order. Please try again.'); }
    finally { setPlacing(false); }
  };

  if (loading) return <PageSpinner />;

  return (
    <motion.div className="flex flex-col gap-6 max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-text-primary">New Order</h1>
      </div>

      {/* Delivery mode */}
      <Card>
        <p className="text-sm font-semibold text-text-secondary mb-3">Delivery Mode</p>
        <div className="grid grid-cols-2 gap-2">
          {(['door_to_door', 'drop_off'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${mode === m ? 'border-gold bg-gold-muted text-gold' : 'border-surface-border text-text-secondary hover:border-gold/40'}`}>
              {m === 'door_to_door' ? '🚪 Door to Door' : '📦 Drop Off'}
            </button>
          ))}
        </div>
      </Card>

      {/* Pickup date */}
      <Card>
        <Input label="Pickup Date" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
      </Card>

      {/* Items */}
      {grid && (
        <Card>
          <p className="text-sm font-semibold text-text-secondary mb-4">Add Items</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-text-secondary font-medium pb-3 pr-4">Item</th>
                  {grid.wash_types.map((wt) => <th key={wt.id} className="text-center text-gold font-medium pb-3 px-2">{wt.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {grid.items.map((item) => (
                  <tr key={item.id} className="border-t border-surface-border">
                    <td className="py-3 pr-4 text-text-primary font-medium">{item.name}</td>
                    {grid.wash_types.map((wt) => {
                      const p = getPrice(item.id, wt.id);
                      const line = lines.find((l) => l.item.id === item.id && l.washType.id === wt.id);
                      return (
                        <td key={wt.id} className="py-3 px-2 text-center">
                          {p > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-text-secondary">{formatPaise(p)}</span>
                              {line ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => updateQty(lines.indexOf(line), -1)} className="w-6 h-6 rounded-md bg-surface-hover flex items-center justify-center"><Minus className="w-3 h-3 text-text-primary" /></button>
                                  <span className="w-6 text-center text-sm font-bold text-gold">{line.quantity}</span>
                                  <button onClick={() => updateQty(lines.indexOf(line), 1)} className="w-6 h-6 rounded-md bg-gold-muted flex items-center justify-center"><Plus className="w-3 h-3 text-gold" /></button>
                                </div>
                              ) : (
                                <button onClick={() => addLine(item, wt)} className="text-xs text-gold border border-gold/30 rounded-lg px-2 py-0.5 hover:bg-gold-muted transition-colors">+ Add</button>
                              )}
                            </div>
                          ) : <span className="text-text-disabled">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary */}
      {lines.length > 0 && (
        <Card>
          <h3 className="font-bold text-text-primary mb-3">Order Summary</h3>
          {lines.map((l, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-surface-border last:border-0">
              <span className="text-text-secondary">{l.item.name} · {l.washType.name} ×{l.quantity}</span>
              <span className="text-text-primary font-medium">{formatPaise(l.pricePaise * l.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base mt-3">
            <span className="text-text-primary">Total</span>
            <span className="text-gold">{formatPaise(total)}</span>
          </div>
        </Card>
      )}

      <Button fullWidth size="lg" onClick={placeOrder} loading={placing} disabled={lines.length === 0 || !pickupDate}>
        Place Order {total > 0 ? `· ${formatPaise(total)}` : ''}
      </Button>
    </motion.div>
  );
}
