import { z } from 'zod';

export const registerWashermanSchema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().min(1).max(100),
  business_name: z.string().min(1).max(150),
  area: z.string().min(1).max(150),
  address: z.string().optional(),
  temp_token: z.string().min(1),
});

export const updateWashermanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  business_name: z.string().min(1).max(150).optional(),
  area: z.string().min(1).max(150).optional(),
  address: z.string().optional(),
  profile_photo_url: z.string().url().optional(),
  is_available: z.boolean().optional(),
  fcm_token: z.string().optional(),
});

export const searchWashermanSchema = z.object({
  area: z.string().optional(),
  code: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
