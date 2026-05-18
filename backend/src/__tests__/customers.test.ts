import {
  registerCustomerSchema,
  selectWashermanSchema,
} from '../modules/customers/customers.schema';

describe('Customer schema validation', () => {
  describe('registerCustomerSchema', () => {
    it('accepts valid registration data', () => {
      const result = registerCustomerSchema.parse({
        phone: '9876543210',
        name: 'Priya Sharma',
        address: '12 Park Lane',
        temp_token: 'some-token',
      });
      expect(result.name).toBe('Priya Sharma');
    });

    it('accepts registration without address', () => {
      const result = registerCustomerSchema.parse({
        phone: '9876543210',
        name: 'Test User',
        temp_token: 'some-token',
      });
      expect(result.name).toBe('Test User');
      expect(result.address).toBeUndefined();
    });

    it('rejects empty name', () => {
      expect(() =>
        registerCustomerSchema.parse({ phone: '9876543210', name: '', temp_token: 'tok' }),
      ).toThrow();
    });

    it('rejects name longer than 100 chars', () => {
      expect(() =>
        registerCustomerSchema.parse({
          phone: '9876543210',
          name: 'a'.repeat(101),
          temp_token: 'tok',
        }),
      ).toThrow();
    });

    it('rejects missing temp_token', () => {
      expect(() =>
        registerCustomerSchema.parse({ phone: '9876543210', name: 'Test User' }),
      ).toThrow();
    });
  });

  describe('selectWashermanSchema', () => {
    it('accepts valid UUID', () => {
      const result = selectWashermanSchema.parse({
        washerman_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.washerman_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('rejects non-UUID washerman_id', () => {
      expect(() => selectWashermanSchema.parse({ washerman_id: 'not-a-uuid' })).toThrow();
    });

    it('rejects missing washerman_id', () => {
      expect(() => selectWashermanSchema.parse({})).toThrow();
    });
  });
});
