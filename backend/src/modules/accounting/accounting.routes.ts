import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { getSummary, downloadReceipt, downloadStatement } from './accounting.controller';

const router = Router();

// Washerman accounting routes
router.get('/summary', authenticate, requireRole('washerman'), getSummary);
router.get('/statement', authenticate, requireRole('washerman'), downloadStatement);

// Both roles: download receipt for an order
router.get('/receipt/:orderId', authenticate, downloadReceipt);

export default router;
