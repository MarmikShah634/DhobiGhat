import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  listNotifications,
  readNotification,
  readAllNotifications,
} from './notifications.controller';

const router = Router();

router.get('/', authenticate, listNotifications);
router.patch('/:id/read', authenticate, readNotification);
router.patch('/read-all', authenticate, readAllNotifications);

export default router;
