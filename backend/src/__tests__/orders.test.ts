import request from 'supertest';
import app from '../app';
import * as ordersService from '../modules/orders/orders.service';
import '../modules/notifications/notifications.service';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

jest.mock('../config/database', () => ({ db: jest.fn() }));
jest.mock('../modules/orders/orders.service');
jest.mock('../modules/notifications/notifications.service', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

function makeToken(role: 'washerman' | 'customer', id: string) {
  return jwt.sign({ id, role, phone: '9876543210' }, env.jwtAccessSecret, { expiresIn: '15m' });
}

const mockOrder = {
  id: 'order-uuid',
  order_number: 'ORD-20240101-0001',
  customer_id: 'cust-uuid',
  washerman_id: 'wm-uuid',
  status: 'pending',
  delivery_mode: 'door_to_door',
  pickup_date: '2024-01-15',
  notes: null,
  total_paise: 5000,
  is_paid: false,
  paid_at: null,
  decline_reason: null,
  washerman_collected_confirmed: false,
  customer_collected_confirmed: false,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('Orders Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/orders', () => {
    it('should place an order', async () => {
      (ordersService.createOrder as jest.Mock).mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`)
        .send({
          washerman_id: '123e4567-e89b-12d3-a456-426614174000',
          delivery_mode: 'door_to_door',
          pickup_date: '2024-01-15',
          items: [{ price_grid_id: '123e4567-e89b-12d3-a456-426614174001', quantity: 2 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.order_number).toBe('ORD-20240101-0001');
    });

    it('should reject washerman placing order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`)
        .send({
          washerman_id: '123e4567-e89b-12d3-a456-426614174000',
          delivery_mode: 'door_to_door',
          pickup_date: '2024-01-15',
          items: [{ price_grid_id: '123e4567-e89b-12d3-a456-426614174001', quantity: 2 }],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/orders', () => {
    it('should list orders for customer', async () => {
      (ordersService.listOrdersForCustomer as jest.Mock).mockResolvedValue({
        data: [mockOrder],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should list orders for washerman', async () => {
      (ordersService.listOrdersForWasherman as jest.Mock).mockResolvedValue({
        data: [mockOrder],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/orders/:id/accept', () => {
    it('should accept an order', async () => {
      const accepted = { ...mockOrder, status: 'accepted' };
      (ordersService.transitionOrderStatus as jest.Mock).mockResolvedValue(accepted);

      const res = await request(app)
        .post('/api/orders/order-uuid/accept')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('accepted');
    });

    it('should reject non-washerman accepting order', async () => {
      const res = await request(app)
        .post('/api/orders/order-uuid/accept')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/orders/:id/decline', () => {
    it('should decline an order with reason', async () => {
      const declined = { ...mockOrder, status: 'declined', decline_reason: 'Busy' };
      (ordersService.transitionOrderStatus as jest.Mock).mockResolvedValue(declined);

      const res = await request(app)
        .post('/api/orders/order-uuid/decline')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`)
        .send({ reason: 'Busy' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('declined');
    });

    it('should fail without reason', async () => {
      const res = await request(app)
        .post('/api/orders/order-uuid/decline')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    it('should allow customer to cancel', async () => {
      const cancelled = { ...mockOrder, status: 'cancelled' };
      (ordersService.transitionOrderStatus as jest.Mock).mockResolvedValue(cancelled);

      const res = await request(app)
        .post('/api/orders/order-uuid/cancel')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Order status flow tests', () => {
    it('should throw INVALID_STATUS_TRANSITION on bad transition', async () => {
      const error = new Error('Cannot transition');
      (error as Error & { statusCode: number; code: string }).statusCode = 422;
      (error as Error & { statusCode: number; code: string }).code = 'INVALID_STATUS_TRANSITION';
      (ordersService.transitionOrderStatus as jest.Mock).mockRejectedValue(error);

      const res = await request(app)
        .post('/api/orders/order-uuid/deliver')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });
});
