import { z } from 'zod';

export const otpRequestSchema = z.object({
  phone: z
    .string()
    .min(10)
    .max(15)
    .regex(/^\+?[0-9]+$/, 'Invalid phone number'),
  role: z.enum(['washerman', 'customer']),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
  role: z.enum(['washerman', 'customer']),
  fcm_token: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
  user_id: z.string().uuid(),
  user_type: z.enum(['washerman', 'customer']),
});
