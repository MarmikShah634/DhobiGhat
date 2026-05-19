import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { OTPInput } from '@/components/ui/OTPInput';

export function OTPPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { phone?: string } };
  const phone = state?.phone ?? '';
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { setTokens } = useAuthStore();

  useEffect(() => {
    if (!phone) { navigate('/auth/phone'); return; }
    if (countdown === 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown, phone, navigate]);

  const handleComplete = async (otp: string) => {
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      if (res.data.is_new_user && res.data.temp_token) {
        navigate('/auth/register', { state: { phone, temp_token: res.data.temp_token } });
      } else {
        await setTokens(res.data.access_token, res.data.refresh_token);
        navigate('/');
      }
    } catch { toast.error('Invalid OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    try { await authApi.requestOtp(phone); setCountdown(60); toast.success('OTP resent'); }
    catch { toast.error('Could not resend OTP'); }
  };

  return (
    <div className="min-h-screen bg-gradient-navy flex items-center justify-center p-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gold mb-2">DhobiGhat</h1>
        </div>
        <div className="bg-bg-secondary border border-surface-border rounded-2xl p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-1">Enter OTP</h2>
            <p className="text-text-secondary text-sm">Sent to +91 {phone} · <button onClick={() => navigate('/auth/phone')} className="text-gold underline">Change</button></p>
          </div>
          <OTPInput onComplete={handleComplete} />
          {loading && <p className="text-text-secondary text-sm animate-pulse">Verifying…</p>}
          <button onClick={resend} disabled={countdown > 0} className="text-sm font-medium disabled:text-text-disabled text-gold">
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
