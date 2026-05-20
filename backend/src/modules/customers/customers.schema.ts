import { z } from 'zod';

export const registerCustomerSchema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  temp_token: z.string().min(1),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().optional(),
  fcm_token: z.string().optional(),
});

export const selectWashermanSchema = z.object({
  washerman_id: z.string().uuid(),
});
