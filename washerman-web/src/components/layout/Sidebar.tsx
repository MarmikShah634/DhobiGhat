import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Tag, BarChart2, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/pricing', icon: Tag, label: 'Pricing' },
  { to: '/accounting', icon: BarChart2, label: 'Accounting' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const { washerman, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/auth/phone');
  };

  const initials = washerman?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-bg-secondary border-r border-surface-border px-4 py-6 shrink-0">
      <div className="px-3 mb-8">
        <h1 className="text-2xl font-black text-gold tracking-tight">DhobiGhat</h1>
        <p className="text-xs text-text-secondary mt-0.5">Washerman Portal</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <motion.div whileHover={{ x: 2 }} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors', isActive ? 'bg-gold-muted text-gold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover')}>
                <Icon className="w-5 h-5" />
                {label}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-border pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gold-muted border border-gold/30 flex items-center justify-center text-xs font-bold text-gold">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{washerman?.name ?? '—'}</p>
            <p className="text-xs text-text-secondary truncate">{washerman?.business_name ?? ''}</p>
          </div>
          <button onClick={handleLogout} className="p-1 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-error transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>
    </aside>
  );
}
