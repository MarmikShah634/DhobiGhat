import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { customersApi } from '@/api/customers';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({ name: z.string().min(2), address: z.string().optional() });
type FormData = z.infer<typeof schema>;

export function EditProfilePage() {
  const navigate = useNavigate();
  const { customer, setCustomer } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: customer?.name ?? '', address: customer?.address ?? '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await customersApi.updateProfile(data);
      setCustomer(res.data);
      toast.success('Profile updated!');
      navigate(-1);
    } catch { toast.error('Could not save changes'); }
  };

  return (
    <motion.div className="flex flex-col gap-6 max-w-lg" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-text-primary">Edit Profile</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Full Name *" {...register('name')} error={errors.name?.message} placeholder="Your full name" />
          <Input label="Address (optional)" {...register('address')} placeholder="Your home address" />
          <Button type="submit" fullWidth loading={isSubmitting}>Save Changes</Button>
        </form>
      </Card>
    </motion.div>
  );
}
