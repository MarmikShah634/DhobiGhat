import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Bell, BarChart2, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { Card } from '@/components/ui/Card';

const MENU = [
  { icon: Edit, label: 'Edit Profile', to: '/profile/edit' },
  { icon: Bell, label: 'Notifications', to: '/profile/notifications' },
  { icon: BarChart2, label: 'Accounting', to: '/profile/accounting' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { customer, logout } = useAuthStore();
  const initials = customer?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/auth/phone');
  };

  return (
    <motion.div className="flex flex-col gap-6 max-w-lg" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-text-primary">Profile</h1>

      <Card className="flex flex-col items-center gap-3 text-center">
        <div className="w-20 h-20 rounded-full bg-gold-muted border-2 border-gold flex items-center justify-center text-gold font-black text-2xl">{initials}</div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{customer?.name}</h2>
          <p className="text-text-secondary text-sm">{customer?.phone}</p>
          {customer?.address && <p className="text-text-secondary text-sm mt-0.5">📍 {customer.address}</p>}
        </div>
        {customer?.washerman && (
          <div className="w-full p-3 bg-gold-muted rounded-xl border border-gold/20 text-left">
            <p className="text-xs text-text-secondary">Your washerman</p>
            <p className="font-semibold text-gold">{customer.washerman.business_name ?? customer.washerman.name}</p>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        {MENU.map(({ icon: Icon, label, to }) => (
          <Card key={to} hover onClick={() => navigate(to)} className="flex items-center gap-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-text-primary" /></div>
            <span className="flex-1 font-medium text-text-primary">{label}</span>
            <ChevronRight className="w-4 h-4 text-text-disabled" />
          </Card>
        ))}
        <Card hover onClick={handleLogout} className="flex items-center gap-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center shrink-0"><LogOut className="w-4 h-4 text-error" /></div>
          <span className="flex-1 font-medium text-error">Sign Out</span>
          <ChevronRight className="w-4 h-4 text-text-disabled" />
        </Card>
      </div>
    </motion.div>
  );
}
