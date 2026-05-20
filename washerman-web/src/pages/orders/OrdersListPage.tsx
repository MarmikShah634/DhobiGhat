import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ordersApi, type Order } from '@/api/orders';
import { Card } from '@/components/ui/Card';
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
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Orders</h1>
        <p className="text-text-secondary text-sm mt-1">Manage all your customer orders</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === f.key ? 'bg-gold text-bg-primary border-gold' : 'border-surface-border text-text-secondary hover:border-gold/50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : orders.length === 0 ? (
        <EmptyState icon="📋" title="No orders found" subtitle={filter ? 'Try a different filter' : 'Orders from customers will appear here'} />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card hover onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gold text-sm">{order.order_number}</p>
                      <StatusBadge status={order.status} />
                      {!order.is_paid && order.status === 'delivered' && <span className="text-xs text-warning font-bold">UNPAID</span>}
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5">
                      {order.customer?.name ?? 'Customer'} · {formatDate(order.pickup_date)} · {order.delivery_mode === 'door_to_door' ? '🚪' : '📦'}
                    </p>
                  </div>
                  <p className="font-bold text-text-primary shrink-0">{formatPaise(order.total_paise)}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
