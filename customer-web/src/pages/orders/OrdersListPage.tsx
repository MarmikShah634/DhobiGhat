import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ordersApi, type Order } from '@/api/orders';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise, formatDate } from '@/lib/utils';

const FILTERS = [
  { key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'in_progress', label: 'Active' },
  { key: 'ready', label: 'Ready' }, { key: 'delivered', label: 'Delivered' }, { key: 'cancelled', label: 'Cancelled' },
];

export function OrdersListPage() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ordersApi.list({ status: filter || undefined, limit: 50 })
      .then((r) => setOrders(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Orders</h1>
          <p className="text-text-secondary text-sm mt-1">Track all your laundry orders</p>
        </div>
        {customer?.washerman_id && (
          <Button onClick={() => navigate('/orders/new')} size="sm">
            <Plus className="w-4 h-4" /> New Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === f.key ? 'bg-gold text-bg-primary border-gold' : 'border-surface-border text-text-secondary hover:border-gold/50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : orders.length === 0 ? (
        <EmptyState icon="📋" title="No orders found" subtitle={filter ? 'Try a different filter' : 'Place your first order!'} action={!filter && customer?.washerman_id ? { label: 'New Order', onClick: () => navigate('/orders/new') } : undefined} />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card hover onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-1 h-12 rounded-full shrink-0" style={{ backgroundColor: `var(--color-status-${order.status.replace('_', '-')}, #8A9BB8)` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gold text-sm">{order.order_number}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5 truncate">
                      {order.washerman?.business_name ?? order.washerman?.name} · {formatDate(order.pickup_date)} · {order.delivery_mode === 'door_to_door' ? '🚪 Door' : '📦 Drop-off'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-text-primary">{formatPaise(order.total_paise)}</p>
                    {!order.is_paid && order.status === 'delivered' && <p className="text-xs text-warning font-medium mt-0.5">Unpaid</p>}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
