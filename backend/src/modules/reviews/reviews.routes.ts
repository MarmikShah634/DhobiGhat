import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { submitReview, getWashermanReviews, getOrderReview } from './reviews.controller';

const router = Router();

// Public: view reviews for a washerman
router.get('/washerman/:washermanId', getWashermanReviews);
router.get('/order/:orderId', getOrderReview);

// Customer only: submit review
router.post('/', authenticate, requireRole('customer'), submitReview);

export default router;
