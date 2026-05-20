import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { notificationsApi, type Notification } from '@/api/notifications';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatRelativeTime } from '@/lib/utils';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list().then((r) => setNotifications(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markRead = async (n: Notification) => {
    if (!n.is_read) {
      notificationsApi.markRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.order_id) navigate(`/orders/${n.order_id}`);
  };

  const markAllRead = () => {
    notificationsApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <motion.div className="flex flex-col gap-4 max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">Notifications</h1>
        {unread > 0 && <button onClick={markAllRead} className="text-gold text-sm font-semibold">Mark all read</button>}
      </div>

      {loading ? <PageSpinner /> : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="All caught up!" subtitle="No notifications" />
      ) : (
        <div className="flex flex-col divide-y divide-surface-border bg-bg-secondary rounded-2xl border border-surface-border overflow-hidden">
          {notifications.map((n) => (
            <button key={n.id} onClick={() => markRead(n)} className={`text-left flex gap-3 px-5 py-4 transition-colors hover:bg-surface-hover ${!n.is_read ? 'bg-gold-muted/50' : ''}`}>
              {!n.is_read && <div className="w-1 rounded-full bg-gold shrink-0 self-stretch" />}
              <div className={`flex-1 min-w-0 ${n.is_read ? 'pl-4' : ''}`}>
                <p className="font-semibold text-sm text-text-primary">{n.title}</p>
                <p className="text-text-secondary text-xs mt-0.5">{n.body}</p>
                <p className="text-text-disabled text-xs mt-1">{formatRelativeTime(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
