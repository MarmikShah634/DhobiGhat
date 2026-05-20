import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  addWashType,
  getWashTypes,
  removeWashType,
  addPriceItem,
  getPriceItems,
  removePriceItem,
  setPrices,
  getGrid,
} from './pricing.controller';

const router = Router();

// Public: view a washerman's pricing grid
router.get('/grid/:washermanId', getGrid);

// Protected washerman routes
router.get('/wash-types', authenticate, requireRole('washerman'), getWashTypes);
router.post('/wash-types', authenticate, requireRole('washerman'), addWashType);
router.delete('/wash-types/:id', authenticate, requireRole('washerman'), removeWashType);

router.get('/items', authenticate, requireRole('washerman'), getPriceItems);
router.post('/items', authenticate, requireRole('washerman'), addPriceItem);
router.delete('/items/:id', authenticate, requireRole('washerman'), removePriceItem);

router.put('/grid', authenticate, requireRole('washerman'), setPrices);
router.get('/grid', authenticate, requireRole('washerman'), getGrid);

export default router;
