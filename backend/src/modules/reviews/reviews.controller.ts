import { Request, Response, NextFunction } from 'express';
import { createError } from '../../middleware/errorHandler';
import { createReviewSchema, listReviewsSchema } from './reviews.schema';
import { createReview, getReviewsForWasherman, getReviewByOrderId } from './reviews.service';

export async function submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const data = createReviewSchema.parse(req.body);
    const review = await createReview(req.user.id, data);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
}

export async function getWashermanReviews(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit } = listReviewsSchema.parse(req.query);
    const result = await getReviewsForWasherman(String(req.params.washermanId), page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getOrderReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const review = await getReviewByOrderId(String(req.params.orderId));
    if (!review) throw createError(404, 'NOT_FOUND', 'Review not found');
    res.json(review);
  } catch (error) {
    next(error);
  }
}
