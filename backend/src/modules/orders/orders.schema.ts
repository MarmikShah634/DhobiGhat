import { z } from 'zod';

export const createOrderSchema = z.object({
  washerman_id: z.string().uuid(),
  delivery_mode: z.enum(['door_to_door', 'drop_off']),
  pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        price_grid_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1),
});

export const acceptOrderSchema = z.object({
  pickup_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const declineOrderSchema = z.object({
  reason: z.string().min(1).max(300),
});

export const listOrdersSchema = z.object({
  status: z
    .enum([
      'pending',
      'accepted',
      'declined',
      'cancelled',
      'collecting',
      'collected',
      'in_progress',
      'ready',
      'delivered',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
