import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { register, getMe, updateMe, deleteMe, search, getById } from './washermen.controller';

const router = Router();

// Public routes
router.post('/register', register);
router.get('/search', search);
router.get('/:id', getById);

// Protected washerman routes
router.get('/me/profile', authenticate, requireRole('washerman'), getMe);
router.patch('/me/profile', authenticate, requireRole('washerman'), updateMe);
router.delete('/me/account', authenticate, requireRole('washerman'), deleteMe);

export default router;
