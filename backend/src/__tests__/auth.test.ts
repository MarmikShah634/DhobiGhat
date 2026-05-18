import { generateUniqueCode } from '../utils/uniqueCode';
import { generateOrderNumber } from '../utils/orderNumber';
import { formatPaise, paiseToCurrency } from '../utils/paise';
import { otpRequestSchema, otpVerifySchema } from '../modules/auth/auth.schema';

describe('Utilities', () => {
  describe('generateUniqueCode', () => {
    it('generates a 6-character alphanumeric code', () => {
      const code = generateUniqueCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('generates different codes', () => {
      const codes = new Set(Array.from({ length: 20 }, () => generateUniqueCode()));
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('generateOrderNumber', () => {
    it('has correct format ORD-YYYYMMDD-XXXX', () => {
      expect(generateOrderNumber()).toMatch(/^ORD-\d{8}-\d{4}$/);
    });
  });

  describe('formatPaise', () => {
    it('formats paise to rupee string', () => {
      expect(formatPaise(2500)).toBe('₹25.00');
      expect(formatPaise(100)).toBe('₹1.00');
      expect(formatPaise(0)).toBe('₹0.00');
      expect(formatPaise(150)).toBe('₹1.50');
    });

    it('converts paise to number', () => {
      expect(paiseToCurrency(2500)).toBe(25);
      expect(paiseToCurrency(150)).toBe(1.5);
    });
  });
});

describe('Auth schema validation', () => {
  describe('otpRequestSchema', () => {
    it('accepts valid phone and role', () => {
      const result = otpRequestSchema.parse({ phone: '9876543210', role: 'customer' });
      expect(result.role).toBe('customer');
    });

    it('accepts washerman role', () => {
      const result = otpRequestSchema.parse({ phone: '9876543210', role: 'washerman' });
      expect(result.role).toBe('washerman');
    });

    it('rejects invalid role', () => {
      expect(() => otpRequestSchema.parse({ phone: '9876543210', role: 'admin' })).toThrow();
    });

    it('rejects short phone', () => {
      expect(() => otpRequestSchema.parse({ phone: '123', role: 'customer' })).toThrow();
    });
  });

  describe('otpVerifySchema', () => {
    it('accepts valid OTP data', () => {
      const result = otpVerifySchema.parse({
        phone: '9876543210',
        otp: '123456',
        role: 'customer',
      });
      expect(result.otp).toBe('123456');
    });

    it('rejects OTP that is not 6 digits', () => {
      expect(() =>
        otpVerifySchema.parse({ phone: '9876543210', otp: '12345', role: 'customer' }),
      ).toThrow();
    });
  });
});

describe('Auth service verifyOtp logic (dev mode - no Twilio)', () => {
  // In dev mode (no Twilio config), verifyOtp uses the fallback:
  // accepts '123456' and rejects anything else.
  // We test the logic directly since auth.service imports are available.
  it('verifyOtp accepts 123456 in dev mode via direct import', async () => {
    // Import the module — no uuid dependency in verifyOtp itself
    const mod = jest.requireActual<typeof import('../modules/auth/auth.service')>(
      '../modules/auth/auth.service',
    );
    // Twilio not configured since env vars are empty in test
    expect(await mod.verifyOtp('+911234567890', '123456')).toBe(true);
  });

  it('verifyOtp rejects wrong OTP in dev mode', async () => {
    const mod = jest.requireActual<typeof import('../modules/auth/auth.service')>(
      '../modules/auth/auth.service',
    );
    expect(await mod.verifyOtp('+911234567890', '000000')).toBe(false);
  });
});
