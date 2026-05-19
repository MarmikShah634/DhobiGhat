import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { ordersApi, type Order } from '@/api/orders';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPaise, formatDate } from '@/lib/utils';

export function CustomerLedgerPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { customerName?: string } };
  const customerName = state?.customerName ?? 'Customer';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    ordersApi.list({ customer_id: customerId, limit: 100 })
      .then((r) => setOrders(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  const totalEarned = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total_paise, 0);
  const totalUnpaid = orders.filter((o) => o.status === 'delivered' && !o.is_paid).reduce((s, o) => s + o.total_paise, 0);

  return (
    <motion.div className="flex flex-col gap-6 max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-text-primary">{customerName}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center flex flex-col gap-1">
          <p className="text-2xl font-black text-gold">{formatPaise(totalEarned)}</p>
          <p className="text-xs text-text-secondary">Total Earned</p>
        </Card>
        <Card className="text-center flex flex-col gap-1" highlighted={totalUnpaid > 0}>
          <p className={`text-2xl font-black ${totalUnpaid > 0 ? 'text-warning' : 'text-success'}`}>{formatPaise(totalUnpaid)}</p>
          <p className="text-xs text-text-secondary">Outstanding</p>
        </Card>
      </div>

      {loading ? <PageSpinner /> : orders.length === 0 ? (
        <EmptyState icon="📋" title="No orders" subtitle="This customer has no orders" />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id} hover onClick={() => navigate(`/orders/${order.id}`)}>
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gold text-sm">{order.order_number}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-text-secondary text-xs mt-0.5">{formatDate(order.pickup_date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-text-primary">{formatPaise(order.total_paise)}</p>
                  {order.status === 'delivered' && !order.is_paid && <p className="text-xs text-warning font-bold">Unpaid</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
