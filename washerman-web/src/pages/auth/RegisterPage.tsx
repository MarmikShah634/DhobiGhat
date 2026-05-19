import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { washermenApi } from '@/api/washermen';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  business_name: z.string().min(2, 'Business name required'),
  area: z.string().min(2, 'Area required'),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { phone?: string; temp_token?: string } };
  const [loading, setLoading] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const { setTokens, setWasherman } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!state?.phone || !state?.temp_token) { navigate('/auth/phone'); return; }
    setLoading(true);
    try {
      const res = await washermenApi.register({ ...data, phone: state.phone, temp_token: state.temp_token });
      setTokens(res.data.access_token, res.data.refresh_token);
      setWasherman(res.data.washerman);
      setUniqueCode(res.data.washerman.unique_code);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err?.response?.data?.error?.message ?? 'Registration failed.');
    } finally { setLoading(false); }
  };

  if (uniqueCode) {
    return (
      <div className="min-h-screen bg-gradient-navy flex items-center justify-center p-4">
        <motion.div className="w-full max-w-md text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="bg-bg-secondary border border-surface-border rounded-2xl p-8 flex flex-col items-center gap-4">
            <span className="text-5xl">🎉</span>
            <h2 className="text-2xl font-bold text-text-primary">Registration Complete!</h2>
            <p className="text-text-secondary text-sm">Share this code with your customers</p>
            <div className="bg-gold-muted border border-gold/30 rounded-2xl px-8 py-5 text-center">
              <p className="text-xs text-gold uppercase tracking-widest mb-1">Your Customer Code</p>
              <p className="text-4xl font-black text-gold tracking-[0.3em]">{uniqueCode}</p>
            </div>
            <Button fullWidth onClick={() => navigate('/')}>Go to Dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-navy flex items-center justify-center p-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10"><h1 className="text-4xl font-black text-gold">DhobiGhat</h1></div>
        <div className="bg-bg-secondary border border-surface-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Register Your Business</h2>
          <p className="text-text-secondary text-sm mb-6">Set up your washerman profile</p>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Full Name *" {...register('name')} error={errors.name?.message} placeholder="Your name" />
            <Input label="Business Name *" {...register('business_name')} error={errors.business_name?.message} placeholder="e.g. Ramesh Laundry" />
            <Input label="Service Area *" {...register('area')} error={errors.area?.message} placeholder="e.g. Andheri West" />
            <Input label="Address (optional)" {...register('address')} placeholder="Your shop / home address" />
            <Button type="submit" fullWidth loading={loading}>Register</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
