import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createError } from '../../middleware/errorHandler';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications.service';

const listSchema = z.object({
  unread: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { unread, page, limit } = listSchema.parse(req.query);
    const result = await getNotifications(req.user.role, req.user.id, unread === true, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function readNotification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await markNotificationRead(String(req.params.id), req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function readAllNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await markAllNotificationsRead(req.user.role, req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}
