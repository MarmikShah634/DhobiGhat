import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Star, Bell, LogOut, ChevronRight, Share2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { washermenApi } from '@/api/washermen';
import { authApi } from '@/api/auth';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

const MENU = [
  { icon: Edit, label: 'Edit Profile', to: '/profile/edit' },
  { icon: Star, label: 'My Reviews', to: '/profile/reviews' },
  { icon: Bell, label: 'Notifications', to: '/profile/notifications' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { washerman, setWasherman, logout } = useAuthStore();
  const [toggling, setToggling] = useState(false);
  const initials = washerman?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const toggleAvail = async (v: boolean) => {
    setToggling(true);
    try { const r = await washermenApi.updateProfile({ is_available: v }); setWasherman(r.data); }
    catch { toast.error('Could not update availability'); }
    finally { setToggling(false); }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/auth/phone');
  };

  const shareCode = () => {
    if (!washerman?.unique_code) return;
    navigator.clipboard.writeText(washerman.unique_code).then(() => toast.success('Code copied!')).catch(() => {});
  };

  return (
    <motion.div className="flex flex-col gap-6 max-w-lg" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-text-primary">Profile</h1>

      {/* Profile card */}
      <Card className="flex flex-col items-center gap-3 text-center">
        <div className="w-20 h-20 rounded-full bg-gold-muted border-2 border-gold flex items-center justify-center text-gold font-black text-2xl">{initials}</div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{washerman?.name}</h2>
          <p className="text-gold font-medium">{washerman?.business_name}</p>
          <p className="text-text-secondary text-sm">{washerman?.phone}</p>
          {washerman?.area && <p className="text-text-secondary text-sm">📍 {washerman.area}</p>}
        </div>
      </Card>

      {/* Unique code */}
      {washerman?.unique_code && (
        <div className="bg-gold-muted border border-gold/30 rounded-2xl p-5 flex flex-col items-center gap-3">
          <p className="text-xs text-gold uppercase tracking-widest font-semibold">Your Customer Code</p>
          <p className="text-4xl font-black text-gold tracking-[0.3em]">{washerman.unique_code}</p>
          <p className="text-text-secondary text-xs text-center">Share this code with customers so they can link to you</p>
          <button onClick={shareCode} className="flex items-center gap-2 text-gold border border-gold/30 rounded-full px-4 py-2 text-sm font-semibold hover:bg-gold-muted transition-colors">
            <Share2 className="w-4 h-4" /> Copy Code
          </button>
        </div>
      )}

      {/* Availability */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-text-primary">Accepting Orders</p>
            <p className={`text-sm font-bold ${washerman?.is_available ? 'text-success' : 'text-error'}`}>
              {washerman?.is_available ? '● Open for business' : '● Closed'}
            </p>
          </div>
          <button onClick={() => toggleAvail(!washerman?.is_available)} disabled={toggling}
            className={`relative w-12 h-7 rounded-full transition-colors ${washerman?.is_available ? 'bg-success' : 'bg-error'} disabled:opacity-50`}>
            <span className={`absolute top-1.5 w-4 h-4 rounded-full bg-white transition-transform ${washerman?.is_available ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </Card>

      {/* Menu */}
      <div className="flex flex-col gap-2">
        {MENU.map(({ icon: Icon, label, to }) => (
          <Card key={to} hover onClick={() => navigate(to)} className="flex items-center gap-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center"><Icon className="w-4 h-4 text-text-primary" /></div>
            <span className="flex-1 font-medium text-text-primary">{label}</span>
            <ChevronRight className="w-4 h-4 text-text-disabled" />
          </Card>
        ))}
        <Card hover onClick={handleLogout} className="flex items-center gap-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center"><LogOut className="w-4 h-4 text-error" /></div>
          <span className="flex-1 font-medium text-error">Sign Out</span>
          <ChevronRight className="w-4 h-4 text-text-disabled" />
        </Card>
      </div>
    </motion.div>
  );
}
