import * as admin from 'firebase-admin';
import { env } from './env';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App | null {
  if (!env.firebaseProjectId || !env.firebasePrivateKey || !env.firebaseClientEmail) {
    return null;
  }
  if (!firebaseApp) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebaseProjectId,
        privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n'),
        clientEmail: env.firebaseClientEmail,
      }),
    });
  }
  return firebaseApp;
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<boolean> {
  try {
    const app = getFirebaseApp();
    if (!app) {
      logger.debug('Firebase not configured — push not sent');
      return false;
    }
    await admin.messaging(app).send({ token, notification: { title, body }, data });
    return true;
  } catch (error) {
    logger.error('FCM send failed', { error });
    return false;
  }
}
