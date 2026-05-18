import request from 'supertest';
import app from '../app';
import * as reviewsService from '../modules/reviews/reviews.service';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

jest.mock('../config/database', () => ({ db: jest.fn() }));
jest.mock('../modules/reviews/reviews.service');

function makeToken(role: 'washerman' | 'customer', id: string) {
  return jwt.sign({ id, role, phone: '9876543210' }, env.jwtAccessSecret, { expiresIn: '15m' });
}

const mockReview = {
  id: 'review-uuid',
  order_id: 'order-uuid',
  customer_id: 'cust-uuid',
  washerman_id: 'wm-uuid',
  rating: 5,
  review_text: 'Excellent service!',
  created_at: new Date(),
};

describe('Reviews Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/reviews', () => {
    it('should submit a review', async () => {
      (reviewsService.createReview as jest.Mock).mockResolvedValue(mockReview);

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`)
        .send({
          order_id: '123e4567-e89b-12d3-a456-426614174000',
          rating: 5,
          review_text: 'Excellent service!',
        });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(5);
    });

    it('should reject invalid rating', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`)
        .send({ order_id: '123e4567-e89b-12d3-a456-426614174000', rating: 6 });

      expect(res.status).toBe(400);
    });

    it('should reject washerman submitting review', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${makeToken('washerman', 'wm-uuid')}`)
        .send({ order_id: '123e4567-e89b-12d3-a456-426614174000', rating: 5 });

      expect(res.status).toBe(403);
    });

    it('should return 422 for non-delivered order', async () => {
      const error = new Error('Can only review delivered orders');
      (error as Error & { statusCode: number; code: string }).statusCode = 422;
      (error as Error & { statusCode: number; code: string }).code = 'REVIEW_NOT_ALLOWED';
      (reviewsService.createReview as jest.Mock).mockRejectedValue(error);

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${makeToken('customer', 'cust-uuid')}`)
        .send({ order_id: '123e4567-e89b-12d3-a456-426614174000', rating: 4 });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/reviews/washerman/:washermanId', () => {
    it('should return reviews for washerman', async () => {
      (reviewsService.getReviewsForWasherman as jest.Mock).mockResolvedValue({
        data: [mockReview],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await request(app).get('/api/reviews/washerman/wm-uuid');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/reviews/order/:orderId', () => {
    it('should return review for order', async () => {
      (reviewsService.getReviewByOrderId as jest.Mock).mockResolvedValue(mockReview);
      const res = await request(app).get('/api/reviews/order/order-uuid');
      expect(res.status).toBe(200);
    });

    it('should return 404 for nonexistent review', async () => {
      (reviewsService.getReviewByOrderId as jest.Mock).mockResolvedValue(null);
      const res = await request(app).get('/api/reviews/order/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
