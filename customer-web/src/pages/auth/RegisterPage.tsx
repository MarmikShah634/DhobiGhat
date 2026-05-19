import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { customersApi } from '@/api/customers';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters'), address: z.string().optional() });
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { phone?: string; temp_token?: string } };
  const [loading, setLoading] = useState(false);
  const { setTokens, setCustomer } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ name, address }: FormData) => {
    if (!state?.phone || !state?.temp_token) { navigate('/auth/phone'); return; }
    setLoading(true);
    try {
      const res = await customersApi.register({ phone: state.phone, name, address: address || undefined, temp_token: state.temp_token });
      setCustomer(res.data);
      const authRes = await import('@/api/auth').then((m) => m.authApi.verifyOtp(state.phone!, ''));
      setTokens(authRes.data.access_token, authRes.data.refresh_token);
      navigate('/');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err?.response?.data?.error?.message ?? 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-navy flex items-center justify-center p-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10"><h1 className="text-4xl font-black text-gold">DhobiGhat</h1></div>
        <div className="bg-bg-secondary border border-surface-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Create Account</h2>
          <p className="text-text-secondary text-sm mb-6">Just a few details to get started</p>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Full Name *" placeholder="Your full name" error={errors.name?.message} {...register('name')} autoCapitalize="words" />
            <Input label="Address (optional)" placeholder="Your home address" {...register('address')} />
            <Button type="submit" fullWidth loading={loading}>Create Account</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
