import { env } from './config/env';
import { logger } from './utils/logger';
import { checkDatabaseConnection } from './config/database';
import { startCollectionReminderCron } from './modules/notifications/notifications.cron';
import app from './app';

async function main() {
  try {
    await checkDatabaseConnection();
    logger.info('Database connection established');
  } catch (error) {
    logger.warn('Database connection failed — starting without DB', { error });
  }

  startCollectionReminderCron();
  logger.info('Collection reminder cron started');

  app.listen(env.port, () => {
    logger.info(`DhobiGhat backend running on port ${env.port} [${env.appEnv}]`);
  });
}

main().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
