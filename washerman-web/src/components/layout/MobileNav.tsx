import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Tag, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/pricing', icon: Tag, label: 'Pricing' },
  { to: '/accounting', icon: BarChart2, label: 'Accounts' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-bg-secondary border-t border-surface-border z-40">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <div className={cn('flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors', isActive ? 'text-gold' : 'text-text-disabled')}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
