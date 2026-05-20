import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number') });
type FormData = z.infer<typeof schema>;

export function PhoneEntryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ phone }: FormData) => {
    setLoading(true);
    try {
      await authApi.requestOtp(phone);
      navigate('/auth/otp', { state: { phone } });
    } catch { toast.error('Could not send OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-navy flex items-center justify-center p-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gold mb-2">DhobiGhat</h1>
          <p className="text-text-secondary">Washerman Portal</p>
        </div>
        <div className="bg-bg-secondary border border-surface-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h2>
          <p className="text-text-secondary text-sm mb-6">Sign in or register your business</p>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Mobile Number" prefix="+91" placeholder="9876543210" error={errors.phone?.message} {...register('phone')} inputMode="numeric" maxLength={10} />
            <Button type="submit" fullWidth loading={loading}>Send OTP</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
