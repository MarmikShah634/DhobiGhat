import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { washermenApi } from '@/api/washermen';
import { ordersApi, type Order } from '@/api/orders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const ACTIVE_STATUSES = ['accepted', 'collecting', 'collected', 'in_progress', 'ready'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { washerman, setWasherman } = useAuthStore();
  const [pending, setPending] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [todayEarned, setTodayEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [declineOrder, setDeclineOrder] = useState<Order | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pendRes, allRes] = await Promise.all([
        ordersApi.list({ status: 'pending', limit: 10 }),
        ordersApi.list({ limit: 30 }),
      ]);
      setPending(pendRes.data.data);
      setActive(allRes.data.data.filter((o) => ACTIVE_STATUSES.includes(o.status)));
      const today = new Date().toISOString().split('T')[0];
      setTodayEarned(allRes.data.data.filter((o) => o.status === 'delivered' && o.is_paid && o.updated_at?.startsWith(today)).reduce((s, o) => s + o.total_paise, 0));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAvail = async (v: boolean) => {
    setTogglingAvail(true);
    try { const r = await washermenApi.updateProfile({ is_available: v }); setWasherman(r.data); }
    catch { toast.error('Could not update availability'); }
    finally { setTogglingAvail(false); }
  };

  const accept = async (order: Order) => {
    setActionLoading(order.id);
    try {
      await ordersApi.accept(order.id);
      setPending((p) => p.filter((o) => o.id !== order.id));
      load();
    } catch { toast.error('Could not accept order'); }
    finally { setActionLoading(null); }
  };

  const confirmDecline = async () => {
    if (!declineOrder) return;
    setActionLoading(declineOrder.id);
    try {
      await ordersApi.decline(declineOrder.id, declineReason || undefined);
      setPending((p) => p.filter((o) => o.id !== declineOrder.id));
      setDeclineOrder(null);
      setDeclineReason('');
    } catch { toast.error('Could not decline order'); }
    finally { setActionLoading(null); }
  };

  if (loading) return <PageSpinner />;

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-text-secondary text-sm">{greeting()},</p>
          <h1 className="text-3xl font-bold text-text-primary">{washerman?.name?.split(' ')[0] ?? 'there'} 👋</h1>
          {washerman?.business_name && <p className="text-gold text-sm mt-0.5">{washerman.business_name}</p>}
        </div>
        {/* Availability toggle */}
        <div className="flex items-center gap-3 bg-bg-secondary border border-surface-border rounded-xl px-4 py-3 shrink-0">
          <div>
            <p className="text-xs text-text-secondary">Status</p>
            <p className={`text-sm font-bold ${washerman?.is_available ? 'text-success' : 'text-error'}`}>
              {washerman?.is_available ? '● Open' : '● Closed'}
            </p>
          </div>
          <button onClick={() => toggleAvail(!washerman?.is_available)} disabled={togglingAvail}
            className={`relative w-11 h-6 rounded-full transition-colors ${washerman?.is_available ? 'bg-success' : 'bg-error'} disabled:opacity-50`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${washerman?.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '🔔 Pending', value: pending.length, color: 'text-warning' },
          { label: '⚙️ Active', value: active.length, color: 'text-info' },
          { label: '💰 Today', value: formatPaise(todayEarned), color: 'text-gold' },
        ].map((k) => (
          <Card key={k.label} className="flex flex-col items-center gap-1 text-center">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Pending orders */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text-primary">Pending Orders</h2>
            <span className="bg-gold text-bg-primary text-xs font-bold px-2.5 py-1 rounded-full">{pending.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {pending.map((order) => (
              <Card key={order.id}>
                <button onClick={() => navigate(`/orders/${order.id}`)} className="w-full text-left mb-3">
                  <p className="font-bold text-gold">{order.order_number}</p>
                  <p className="text-text-secondary text-sm mt-0.5">
                    {order.customer?.name ?? 'Customer'} · {order.delivery_mode === 'door_to_door' ? '🚪' : '📦'} · {formatDate(order.pickup_date)}
                  </p>
                  <p className="font-bold text-text-primary mt-1">{formatPaise(order.total_paise)}</p>
                </button>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" fullWidth onClick={() => { setDeclineOrder(order); setDeclineReason(''); }}>
                    <XCircle className="w-4 h-4" /> Decline
                  </Button>
                  <Button size="sm" fullWidth onClick={() => accept(order)} loading={actionLoading === order.id}>
                    <CheckCircle className="w-4 h-4" /> Accept
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active orders */}
      {active.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text-primary">Active Orders</h2>
            <button onClick={() => navigate('/orders')} className="text-gold text-sm font-medium flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((order) => (
              <Card key={order.id} hover onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gold text-sm">{order.order_number}</p>
                    <p className="text-text-secondary text-xs mt-0.5">{order.customer?.name ?? 'Customer'}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Decline modal */}
      <Modal open={!!declineOrder} onClose={() => setDeclineOrder(null)} title="Decline Order">
        <div className="flex flex-col gap-4">
          {declineOrder && <p className="text-text-secondary text-sm">{declineOrder.order_number} · {declineOrder.customer?.name}</p>}
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1.5">Reason (optional)</p>
            <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Customer will see this reason" rows={3}
              className="w-full bg-bg-primary border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-gold resize-none text-sm" />
          </div>
          <Button fullWidth variant="destructive" onClick={confirmDecline} loading={!!actionLoading}>Decline Order</Button>
        </div>
      </Modal>
    </motion.div>
  );
}
