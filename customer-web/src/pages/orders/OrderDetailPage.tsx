import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { ordersApi, type Order } from '@/api/orders';
import { reviewsApi } from '@/api/reviews';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise, formatDate, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'accepted', 'collecting', 'collected', 'in_progress', 'ready', 'delivered'];
const STEP_LABELS: Record<string, string> = { pending: 'Order Placed', accepted: 'Accepted', collecting: 'Collecting', collected: 'Collected', in_progress: 'In Progress', ready: 'Ready', delivered: 'Delivered' };

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try { const r = await ordersApi.get(id); setOrder(r.data); }
    catch { toast.error('Could not load order'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (fn: () => Promise<unknown>) => {
    setActionLoading(true);
    try { await fn(); await load(); }
    catch { toast.error('Action failed. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const submitReview = async () => {
    if (!order) return;
    setSubmittingReview(true);
    try {
      await reviewsApi.submit({ washerman_id: order.washerman!.id, order_id: order.id, rating, comment: comment || undefined });
      toast.success('Review submitted!');
      setShowReview(false);
    } catch { toast.error('Could not submit review'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <PageSpinner />;
  if (!order) return null;

  const steps = order.delivery_mode === 'door_to_door' ? STATUS_STEPS : STATUS_STEPS.filter((s) => !['collecting', 'collected'].includes(s));
  const currIdx = steps.indexOf(order.status);
  const isTerminal = ['delivered', 'cancelled', 'declined'].includes(order.status);

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

      {/* Status Timeline */}
      {!isTerminal && (
        <Card>
          <h3 className="font-bold text-text-primary mb-4">Order Status</h3>
          <div className="flex flex-col gap-3">
            {steps.map((step, i) => {
              const done = i < currIdx; const current = step === order.status;
              const color = getStatusColor(order.status);
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${done ? 'bg-gold border-gold' : current ? 'border-gold bg-gold/20' : 'border-surface-border'}`} />
                  <span className={`text-sm font-medium ${current ? 'text-gold' : done ? 'text-text-primary' : 'text-text-disabled'}`}>{STEP_LABELS[step]}</span>
                  {current && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${color}22`, color }}>{STEP_LABELS[step]}</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Washerman */}
      {order.washerman && (
        <Card>
          <h3 className="font-bold text-text-secondary text-xs uppercase tracking-wider mb-2">Washerman</h3>
          <p className="font-semibold text-text-primary">{order.washerman.business_name ?? order.washerman.name}</p>
          {order.washerman.phone && <p className="text-text-secondary text-sm">{order.washerman.phone}</p>}
        </Card>
      )}

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <Card>
          <h3 className="font-bold text-text-primary mb-3">Items</h3>
          <div className="flex flex-col gap-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{item.item_name}</p>
                  <p className="text-xs text-text-secondary">{item.wash_type_name}</p>
                </div>
                <span className="text-text-secondary text-sm">×{item.quantity}</span>
                <span className="text-gold font-semibold text-sm min-w-[60px] text-right">{formatPaise(item.subtotal_paise)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2">
              <span className="text-text-primary">Total</span>
              <span className="text-gold text-lg">{formatPaise(order.total_paise)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Payment */}
      <Card>
        <h3 className="font-bold text-text-secondary text-xs uppercase tracking-wider mb-2">Payment</h3>
        <p className={`font-bold text-lg ${order.is_paid ? 'text-success' : 'text-warning'}`}>
          {order.is_paid ? '✓ Paid' : `⏳ Unpaid · ${formatPaise(order.total_paise)}`}
        </p>
      </Card>

      {/* Actions */}
      {order.status === 'collecting' && (
        <Button fullWidth onClick={() => doAction(() => ordersApi.confirmCollection(order.id))} loading={actionLoading}>
          <CheckCircle className="w-4 h-4" /> Confirm Collection
        </Button>
      )}
      {order.status === 'delivered' && (
        <Button fullWidth variant="secondary" onClick={() => setShowReview(true)}>
          ⭐ Leave a Review
        </Button>
      )}
      {['pending', 'accepted'].includes(order.status) && (
        <Button fullWidth variant="destructive" onClick={() => doAction(() => ordersApi.cancel(order.id))} loading={actionLoading}>
          <XCircle className="w-4 h-4" /> Cancel Order
        </Button>
      )}

      {/* Review modal */}
      <Modal open={showReview} onClose={() => setShowReview(false)} title="Leave a Review">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-text-secondary mb-2">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'text-gold' : 'text-text-disabled'}`}>★</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-text-secondary mb-2">Comment (optional)</p>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" rows={3} className="w-full bg-bg-primary border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-gold resize-none text-sm" />
          </div>
          <Button fullWidth onClick={submitReview} loading={submittingReview}>Submit Review</Button>
        </div>
      </Modal>
    </motion.div>
  );
}
