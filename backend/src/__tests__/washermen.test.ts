import { generateUniqueCode } from '../utils/uniqueCode';
import {
  registerWashermanSchema,
  updateWashermanSchema,
} from '../modules/washermen/washermen.schema';

describe('Washerman unique code', () => {
  it('generates codes with only uppercase letters and digits', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateUniqueCode()).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it('always generates 6-character codes', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateUniqueCode()).toHaveLength(6);
    }
  });
});

describe('Washerman schema validation', () => {
  describe('registerWashermanSchema', () => {
    it('rejects missing required fields', () => {
      expect(() => registerWashermanSchema.parse({})).toThrow();
    });

    it('rejects name longer than 100 chars', () => {
      expect(() =>
        registerWashermanSchema.parse({
          phone: '9876543210',
          name: 'a'.repeat(101),
          business_name: 'Test Shop',
          area: 'Andheri',
          temp_token: 'tok',
        }),
      ).toThrow();
    });

    it('accepts valid input', () => {
      const result = registerWashermanSchema.parse({
        phone: '9876543210',
        name: 'Ramesh Kumar',
        business_name: 'Ramesh Laundry',
        area: 'Andheri West',
        address: '42 Main Street',
        temp_token: 'some-token',
      });
      expect(result.name).toBe('Ramesh Kumar');
      expect(result.area).toBe('Andheri West');
    });
  });

  describe('updateWashermanSchema', () => {
    it('accepts boolean is_available true', () => {
      expect(updateWashermanSchema.parse({ is_available: true }).is_available).toBe(true);
    });

    it('accepts boolean is_available false', () => {
      expect(updateWashermanSchema.parse({ is_available: false }).is_available).toBe(false);
    });

    it('accepts partial updates', () => {
      const result = updateWashermanSchema.parse({ name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('rejects name over 100 chars', () => {
      expect(() => updateWashermanSchema.parse({ name: 'a'.repeat(101) })).toThrow();
    });
  });
});
