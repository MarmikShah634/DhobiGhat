import {
  createWashTypeSchema,
  createPriceItemSchema,
  upsertPriceGridSchema,
} from '../modules/pricing/pricing.schema';

describe('Pricing schema validation', () => {
  describe('createPriceItemSchema (addItemSchema)', () => {
    it('accepts valid item name', () => {
      expect(createPriceItemSchema.parse({ item_name: 'Shirt' }).item_name).toBe('Shirt');
    });

    it('rejects empty item name', () => {
      expect(() => createPriceItemSchema.parse({ item_name: '' })).toThrow();
    });

    it('rejects item name over 100 chars', () => {
      expect(() => createPriceItemSchema.parse({ item_name: 'a'.repeat(101) })).toThrow();
    });
  });

  describe('createWashTypeSchema (addWashTypeSchema)', () => {
    it('accepts valid wash type', () => {
      expect(createWashTypeSchema.parse({ name: 'Dry Clean' }).name).toBe('Dry Clean');
    });

    it('rejects empty name', () => {
      expect(() => createWashTypeSchema.parse({ name: '' })).toThrow();
    });
  });

  describe('upsertPriceGridSchema (setPriceSchema)', () => {
    it('accepts positive integer paise', () => {
      const entry = upsertPriceGridSchema.parse({
        price_item_id: '550e8400-e29b-41d4-a716-446655440000',
        wash_type_id: '550e8400-e29b-41d4-a716-446655440001',
        price_paise: 2500,
      });
      expect(entry.price_paise).toBe(2500);
    });

    it('rejects zero price', () => {
      expect(() =>
        upsertPriceGridSchema.parse({
          price_item_id: '550e8400-e29b-41d4-a716-446655440000',
          wash_type_id: '550e8400-e29b-41d4-a716-446655440001',
          price_paise: 0,
        }),
      ).toThrow();
    });

    it('rejects negative price', () => {
      expect(() =>
        upsertPriceGridSchema.parse({
          price_item_id: '550e8400-e29b-41d4-a716-446655440000',
          wash_type_id: '550e8400-e29b-41d4-a716-446655440001',
          price_paise: -100,
        }),
      ).toThrow();
    });

    it('rejects non-integer price', () => {
      expect(() =>
        upsertPriceGridSchema.parse({
          price_item_id: '550e8400-e29b-41d4-a716-446655440000',
          wash_type_id: '550e8400-e29b-41d4-a716-446655440001',
          price_paise: 25.5,
        }),
      ).toThrow();
    });
  });
});
