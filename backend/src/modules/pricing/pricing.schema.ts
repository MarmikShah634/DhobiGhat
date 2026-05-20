import { z } from 'zod';

export const createWashTypeSchema = z.object({
  name: z.string().min(1).max(100),
});

export const createPriceItemSchema = z.object({
  item_name: z.string().min(1).max(100),
});

export const upsertPriceGridSchema = z.object({
  price_item_id: z.string().uuid(),
  wash_type_id: z.string().uuid(),
  price_paise: z.number().int().positive(),
});

export const bulkUpsertPriceGridSchema = z.object({
  entries: z.array(upsertPriceGridSchema).min(1),
});
