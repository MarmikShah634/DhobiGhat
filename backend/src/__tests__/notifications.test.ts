import request from 'supertest';
import app from '../app';
import * as notificationsService from '../modules/notifications/notifications.service';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

jest.mock('../config/database', () => ({ db: jest.fn() }));
jest.mock('../modules/notifications/notifications.service');

function makeToken(role: 'washerman' | 'customer', id: string) {
  return jwt.sign({ id, role, phone: '9876543210' }, env.jwtAccessSecret, { expiresIn: '15m' });
}

const mockNotification = {
  id: 'notif-uuid',
  recipient_type: 'customer',
  recipient_id: 'cust-uuid',
  order_id: 'order-uuid',
  title: 'Order Update',
  body: 'Your order has been accepted',
  is_read: false,
  sent_at: new Date(),
};

describe('Notifications Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      (notificationsService.getNotifications as jest.Mock).mockResolvedValue({
        data: [mockNotification],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should filter unread notifications', async () => {
      (notificationsService.getNotifications as jest.Mock).mockResolvedValue({
        data: [mockNotification],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await request(app)
        .get('/api/notifications?unread=true')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`);

      expect(res.status).toBe(200);
      expect(notificationsService.getNotifications).toHaveBeenCalledWith(
        'customer',
        'cust-uuid',
        true,
        1,
        20,
      );
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      (notificationsService.markNotificationRead as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .patch('/api/notifications/notif-uuid/read')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Notification marked as read');
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      (notificationsService.markAllNotificationsRead as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`);

      expect(res.status).toBe(200);
    });
  });
});
