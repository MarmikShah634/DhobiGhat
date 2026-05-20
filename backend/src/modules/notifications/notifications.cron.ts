import cron from 'node-cron';
import { db } from '../../config/database';
import { sendNotification } from './notifications.service';
import { logger } from '../../utils/logger';

/**
 * Runs every 2 hours. Finds orders in 'collecting' status for > 2 hours
 * and sends reminder notifications.
 */
export function startCollectionReminderCron(): void {
  cron.schedule('0 */2 * * *', async () => {
    logger.info('Running collection reminder cron');
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const stalledOrders = await db('orders')
        .where({ status: 'collecting' })
        .where('updated_at', '<', twoHoursAgo)
        .select('*');

      for (const order of stalledOrders) {
        await sendNotification(
          'washerman',
          order.washerman_id as string,
          order.id as string,
          'Collection Reminder',
          `Order ${order.order_number as string} has been in 'collecting' status for over 2 hours.`,
          { order_id: order.id as string, type: 'collection_reminder' },
        );

        await sendNotification(
          'customer',
          order.customer_id as string,
          order.id as string,
          'Collection Pending',
          `Your order ${order.order_number as string} collection is pending. Please coordinate with your washerman.`,
          { order_id: order.id as string, type: 'collection_reminder' },
        );
      }

      logger.info(`Collection reminder: notified for ${stalledOrders.length} orders`);
    } catch (error) {
      logger.error('Collection reminder cron failed', { error });
    }
  });
}
