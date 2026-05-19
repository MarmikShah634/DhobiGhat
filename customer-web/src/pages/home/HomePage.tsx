import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, Package } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ordersApi, type Order } from '@/api/orders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise, formatDate } from '@/lib/utils';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening';
}

export function HomePage() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list({ limit: 5 })
      .then((r) => setActiveOrders(r.data.data.filter((o) => !['delivered', 'cancelled', 'declined'].includes(o.status))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Hero */}
      <div className="bg-gradient-navy rounded-2xl p-6 border border-surface-border">
        <p className="text-text-secondary text-sm mb-1">{greeting()},</p>
        <h1 className="text-3xl font-bold text-text-primary mb-4">{customer?.name?.split(' ')[0] ?? 'there'} 👋</h1>
        {customer?.washerman ? (
          <div className="flex items-center gap-3 p-3 bg-gold-muted rounded-xl border border-gold/20">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
              {customer.washerman.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary">Your washerman</p>
              <p className="font-semibold text-text-primary">{customer.washerman.business_name ?? customer.washerman.name}</p>
            </div>
            <Button size="sm" onClick={() => navigate('/orders/new')}>
              <Plus className="w-4 h-4" /> New Order
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-text-secondary text-sm">You haven't selected a washerman yet.</p>
            <Button onClick={() => navigate('/browse')} size="sm" variant="secondary">
              Browse Washermen <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text-primary">Active Orders</h2>
            <button onClick={() => navigate('/orders')} className="text-gold text-sm font-medium flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col gap-3">
            {activeOrders.map((order) => (
              <Card key={order.id} hover onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold-muted flex items-center justify-center"><Package className="w-5 h-5 text-gold" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gold text-sm">{order.order_number}</p>
                    <p className="text-text-secondary text-xs truncate">{order.washerman?.business_name ?? order.washerman?.name} · {formatDate(order.pickup_date)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-text-primary font-semibold text-sm mt-1">{formatPaise(order.total_paise)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '🧺', label: 'New Order', desc: 'Place a laundry order', to: '/orders/new' },
          { icon: '📋', label: 'All Orders', desc: 'Track your orders', to: '/orders' },
          { icon: '🔍', label: 'Browse', desc: 'Find a washerman', to: '/browse' },
          { icon: '❤️', label: 'Favourites', desc: 'Your saved washermen', to: '/favourites' },
        ].map((item) => (
          <Card key={item.to} hover onClick={() => navigate(item.to)} className="flex flex-col gap-2">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-text-primary text-sm">{item.label}</p>
              <p className="text-text-secondary text-xs">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
