import { db } from '../../config/database';
import { createError } from '../../middleware/errorHandler';

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  washerman_id: string;
  rating: number;
  review_text: string | null;
  created_at: Date;
}

export async function createReview(
  customerId: string,
  data: {
    order_id: string;
    rating: number;
    review_text?: string;
  },
): Promise<Review> {
  // Validate order belongs to customer and is delivered
  const order = await db('orders').where({ id: data.order_id, customer_id: customerId }).first();

  if (!order) throw createError(404, 'NOT_FOUND', 'Order not found');
  if (order.status !== 'delivered') {
    throw createError(422, 'REVIEW_NOT_ALLOWED', 'Can only review delivered orders');
  }

  // Check no existing review
  const existing = await db('reviews').where({ order_id: data.order_id }).first();
  if (existing) throw createError(409, 'REVIEW_EXISTS', 'Order already reviewed');

  const [review] = await db('reviews')
    .insert({
      order_id: data.order_id,
      customer_id: customerId,
      washerman_id: order.washerman_id,
      rating: data.rating,
      review_text: data.review_text || null,
    })
    .returning('*');

  return review as Review;
}

export async function getReviewsForWasherman(
  washermanId: string,
  page = 1,
  limit = 20,
): Promise<{ data: Review[]; total: number; page: number; limit: number }> {
  const countResult = await db('reviews')
    .where({ washerman_id: washermanId })
    .count('id as count')
    .first();
  const total = parseInt(String(countResult?.count || 0), 10);

  const data = await db('reviews')
    .where({ washerman_id: washermanId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);

  return { data: data as Review[], total, page, limit };
}

export async function getReviewByOrderId(orderId: string): Promise<Review | null> {
  const review = await db('reviews').where({ order_id: orderId }).first();
  return review ? (review as Review) : null;
}
