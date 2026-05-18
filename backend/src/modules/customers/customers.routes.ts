import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  register,
  getMe,
  updateMe,
  deleteMe,
  selectWasherman,
  listFavourites,
  addToFavourites,
  removeFromFavourites,
} from './customers.controller';

const router = Router();

// Public
router.post('/register', register);

// Protected customer routes
router.get('/me/profile', authenticate, requireRole('customer'), getMe);
router.patch('/me/profile', authenticate, requireRole('customer'), updateMe);
router.delete('/me/account', authenticate, requireRole('customer'), deleteMe);
router.post('/me/washerman', authenticate, requireRole('customer'), selectWasherman);
router.get('/me/favourites', authenticate, requireRole('customer'), listFavourites);
router.post('/me/favourites/:washermanId', authenticate, requireRole('customer'), addToFavourites);
router.delete(
  '/me/favourites/:washermanId',
  authenticate,
  requireRole('customer'),
  removeFromFavourites,
);

export default router;
