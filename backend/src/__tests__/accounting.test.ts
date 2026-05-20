import request from 'supertest';
import app from '../app';
import * as accountingService from '../modules/accounting/accounting.service';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

jest.mock('../config/database', () => ({ db: jest.fn() }));
jest.mock('../modules/accounting/accounting.service');

function makeToken(role: 'washerman' | 'customer', id: string) {
  return jwt.sign({ id, role, phone: '9876543210' }, env.jwtAccessSecret, { expiresIn: '15m' });
}

const mockSummary = {
  period_start: '2024-01-01',
  period_end: '2024-01-31',
  total_orders: 10,
  delivered_orders: 8,
  total_revenue_paise: 80000,
  paid_revenue_paise: 60000,
  unpaid_revenue_paise: 20000,
  avg_order_value_paise: 10000,
};

describe('Accounting Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/accounting/summary', () => {
    it('should return summary for washerman', async () => {
      (accountingService.getAccountingSummary as jest.Mock).mockResolvedValue(mockSummary);

      const res = await request(app)
        .get('/api/accounting/summary?start_date=2024-01-01&end_date=2024-01-31')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`);

      expect(res.status).toBe(200);
      expect(res.body.total_orders).toBe(10);
      expect(res.body.total_revenue_paise).toBe(80000);
    });

    it('should reject customer access', async () => {
      const res = await request(app)
        .get('/api/accounting/summary?start_date=2024-01-01&end_date=2024-01-31')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`);

      expect(res.status).toBe(403);
    });

    it('should fail with invalid date format', async () => {
      const res = await request(app)
        .get('/api/accounting/summary?start_date=01-01-2024&end_date=31-01-2024')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/accounting/receipt/:orderId', () => {
    it('should return PDF receipt', async () => {
      const pdfBuffer = Buffer.from('%PDF-mock');
      (accountingService.generateOrderReceiptPdf as jest.Mock).mockResolvedValue(pdfBuffer);

      const res = await request(app)
        .get('/api/accounting/receipt/order-uuid')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
    });
  });

  describe('GET /api/accounting/statement', () => {
    it('should return PDF statement for washerman', async () => {
      const pdfBuffer = Buffer.from('%PDF-mock-statement');
      (accountingService.generateStatementPdf as jest.Mock).mockResolvedValue(pdfBuffer);

      const res = await request(app)
        .get('/api/accounting/statement?start_date=2024-01-01&end_date=2024-01-31')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
    });
  });
});
