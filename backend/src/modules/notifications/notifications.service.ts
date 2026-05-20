import { db } from '../../config/database';
import { sendPushNotification } from '../../config/firebase';
import { logger } from '../../utils/logger';

export interface Notification {
  id: string;
  recipient_type: string;
  recipient_id: string;
  order_id: string | null;
  title: string;
  body: string;
  is_read: boolean;
  sent_at: Date;
}

export async function sendNotification(
  recipientType: 'washerman' | 'customer',
  recipientId: string,
  orderId: string | null,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    // Store in DB
    await db('notifications').insert({
      recipient_type: recipientType,
      recipient_id: recipientId,
      order_id: orderId,
      title,
      body,
    });

    // Get FCM token
    const table = recipientType === 'washerman' ? 'washermen' : 'customers';
    const user = await db(table).where({ id: recipientId }).first();

    if (user?.fcm_token) {
      await sendPushNotification(user.fcm_token as string, title, body, data);
    }
  } catch (error) {
    logger.error('Failed to send notification', { error, recipientType, recipientId });
  }
}

export async function getNotifications(
  recipientType: string,
  recipientId: string,
  onlyUnread = false,
  page = 1,
  limit = 20,
): Promise<{ data: Notification[]; total: number; page: number; limit: number }> {
  let query = db('notifications').where({
    recipient_type: recipientType,
    recipient_id: recipientId,
  });

  if (onlyUnread) query = query.where({ is_read: false });

  const countResult = await query.clone().count('id as count').first();
  const total = parseInt(String(countResult?.count || 0), 10);

  const data = await query
    .orderBy('sent_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);

  return { data: data as Notification[], total, page, limit };
}

export async function markNotificationRead(
  notificationId: string,
  recipientId: string,
): Promise<void> {
  await db('notifications')
    .where({ id: notificationId, recipient_id: recipientId })
    .update({ is_read: true });
}

export async function markAllNotificationsRead(
  recipientType: string,
  recipientId: string,
): Promise<void> {
  await db('notifications')
    .where({ recipient_type: recipientType, recipient_id: recipientId })
    .update({ is_read: true });
}
