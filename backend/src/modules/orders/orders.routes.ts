import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  placeOrder,
  getOrder,
  listOrders,
  acceptOrder,
  declineOrder,
  cancelOrder,
  startCollecting,
  confirmCollection,
  startProcessing,
  markReady,
  markDelivered,
  recordPayment,
} from './orders.controller';

const router = Router();

// Authenticated routes (both roles)
router.get('/', authenticate, listOrders);
router.get('/:id', authenticate, getOrder);

// Customer actions
router.post('/', authenticate, requireRole('customer'), placeOrder);
router.post('/:id/cancel', authenticate, requireRole('customer'), cancelOrder);
router.post('/:id/confirm-collection', authenticate, confirmCollection);

// Washerman actions
router.post('/:id/accept', authenticate, requireRole('washerman'), acceptOrder);
router.post('/:id/decline', authenticate, requireRole('washerman'), declineOrder);
router.post('/:id/start-collecting', authenticate, requireRole('washerman'), startCollecting);
router.post('/:id/in-progress', authenticate, requireRole('washerman'), startProcessing);
router.post('/:id/ready', authenticate, requireRole('washerman'), markReady);
router.post('/:id/deliver', authenticate, requireRole('washerman'), markDelivered);
router.post('/:id/pay', authenticate, requireRole('washerman'), recordPayment);

export default router;
