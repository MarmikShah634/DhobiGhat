import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { ordersApi, type Order } from '@/api/orders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'accepted', 'collecting', 'collected', 'in_progress', 'ready', 'delivered'];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try { const r = await ordersApi.get(id); setOrder(r.data); }
    catch { toast.error('Could not load order'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (fn: () => Promise<unknown>, label?: string) => {
    setActionLoading(true);
    try { await fn(); await load(); toast.success(label ?? 'Done!'); }
    catch { toast.error('Action failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <PageSpinner />;
  if (!order) return null;

  const steps = order.delivery_mode === 'door_to_door' ? STATUS_STEPS : STATUS_STEPS.filter((s) => !['collecting', 'collected'].includes(s));
  const currIdx = steps.indexOf(order.status);

  const renderActions = () => {
    if (order.status === 'pending') return (
      <div className="flex gap-3">
        <Button variant="destructive" fullWidth onClick={() => setShowDecline(true)}>
          <XCircle className="w-4 h-4" /> Decline
        </Button>
        <Button fullWidth onClick={() => doAction(() => ordersApi.accept(order.id), 'Order accepted')} loading={actionLoading}>
          <CheckCircle className="w-4 h-4" /> Accept
        </Button>
      </div>
    );
    if (order.status === 'accepted') return <Button fullWidth onClick={() => doAction(() => ordersApi.startCollecting(order.id))} loading={actionLoading}>Mark as Collecting</Button>;
    if (order.status === 'collecting') return <Button fullWidth variant="secondary" disabled>Waiting for customer confirmation…</Button>;
    if (order.status === 'collected') return <Button fullWidth onClick={() => doAction(() => ordersApi.markInProgress(order.id))} loading={actionLoading}>Mark as In Progress</Button>;
    if (order.status === 'in_progress') return <Button fullWidth onClick={() => doAction(() => ordersApi.markReady(order.id))} loading={actionLoading}>Mark as Ready</Button>;
    if (order.status === 'ready') return <Button fullWidth onClick={() => doAction(() => ordersApi.markDelivered(order.id))} loading={actionLoading}>Mark as Delivered</Button>;
    if (order.status === 'delivered' && !order.is_paid) return (
      <Button fullWidth onClick={() => { if (confirm(`Confirm payment of ${formatPaise(order.total_paise)} received?`)) doAction(() => ordersApi.markPaid(order.id), 'Marked as paid'); }} loading={actionLoading}>
        💰 Mark as Paid · {formatPaise(order.total_paise)}
      </Button>
    );
    return null;
  };

  return (
    <motion.div className="flex flex-col gap-6 max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gold">{order.order_number}</h1>
          <p className="text-text-secondary text-xs">{formatDate(order.pickup_date)} · {order.delivery_mode === 'door_to_door' ? 'Door to Door' : 'Drop Off'}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Action bar */}
      <AnimatePresence mode="wait">
        <motion.div key={order.status} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          {renderActions()}
        </motion.div>
      </AnimatePresence>

      {/* Customer */}
      <Card>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Customer</p>
        <p className="font-semibold text-text-primary">{order.customer?.name ?? 'Customer'}</p>
        {order.customer?.phone && <p className="text-text-secondary text-sm">{order.customer.phone}</p>}
        {order.customer?.address && <p className="text-text-secondary text-sm">📍 {order.customer.address}</p>}
      </Card>

      {/* Timeline */}
      {!['cancelled', 'declined'].includes(order.status) && (
        <Card>
          <p className="font-bold text-text-primary mb-4">Status Timeline</p>
          <div className="flex flex-col gap-3">
            {steps.map((step, i) => {
              const done = i < currIdx; const current = step === order.status;
              const color = getStatusColor(order.status);
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${done ? 'bg-gold border-gold' : current ? 'border-gold bg-gold/20' : 'border-surface-border'}`} />
                  <span className={`text-sm font-medium ${current ? 'text-gold' : done ? 'text-text-primary' : 'text-text-disabled'}`}>{getStatusLabel(step)}</span>
                  {current && <span className="text-xs px-2 py-0.5 rounded-full font-bold ml-auto" style={{ backgroundColor: `${color}22`, color }}>Current</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <Card>
          <p className="font-bold text-text-primary mb-3">Items</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{item.item_name}</p>
                <p className="text-xs text-text-secondary">{item.wash_type_name}</p>
              </div>
              <span className="text-text-secondary text-sm">×{item.quantity}</span>
              <span className="text-gold font-semibold text-sm min-w-[64px] text-right">{formatPaise(item.subtotal_paise)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-3">
            <span className="text-text-primary">Total</span>
            <span className="text-gold text-lg">{formatPaise(order.total_paise)}</span>
          </div>
        </Card>
      )}

      {/* Payment */}
      <Card>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Payment</p>
        <p className={`font-bold text-lg ${order.is_paid ? 'text-success' : 'text-warning'}`}>
          {order.is_paid ? '✓ Paid' : `⏳ Unpaid · ${formatPaise(order.total_paise)}`}
        </p>
      </Card>

      {/* Decline modal */}
      <Modal open={showDecline} onClose={() => setShowDecline(false)} title="Decline Order">
        <div className="flex flex-col gap-4">
          <p className="text-text-secondary text-sm">{order.order_number} · {order.customer?.name}</p>
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1.5">Reason (optional)</p>
            <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Customer will see this reason" rows={3}
              className="w-full bg-bg-primary border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-gold resize-none text-sm" />
          </div>
          <Button fullWidth variant="destructive" onClick={async () => { await doAction(() => ordersApi.decline(order.id, declineReason || undefined)); setShowDecline(false); }} loading={actionLoading}>
            Decline Order
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
