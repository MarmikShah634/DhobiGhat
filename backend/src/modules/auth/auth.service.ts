import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { createError } from '../../middleware/errorHandler';
import { JwtPayload } from '../../middleware/auth';
import { logger } from '../../utils/logger';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

const twilioClient =
  env.twilioAccountSid && env.twilioAuthToken
    ? twilio(env.twilioAccountSid, env.twilioAuthToken)
    : null;

export async function sendOtp(phone: string): Promise<void> {
  if (!twilioClient) {
    logger.warn('Twilio not configured — OTP not sent (dev mode)');
    return;
  }
  await twilioClient.verify.v2.services(env.twilioVerifyServiceSid).verifications.create({
    to: phone,
    channel: 'sms',
  });
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  if (!twilioClient) {
    return otp === '123456';
  }
  try {
    const result = await twilioClient.verify.v2
      .services(env.twilioVerifyServiceSid)
      .verificationChecks.create({ to: phone, code: otp });
    return result.status === 'approved';
  } catch {
    return false;
  }
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: '15m' });
}

export function generateTokens(payload: JwtPayload): TokenPair {
  const access_token = generateAccessToken(payload);
  const refresh_token = randomUUID();
  return { access_token, refresh_token };
}

export async function saveRefreshToken(
  userId: string,
  userType: string,
  token: string,
): Promise<void> {
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db('refresh_tokens').insert({
    user_id: userId,
    user_type: userType,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
}

export async function rotateRefreshToken(
  oldToken: string,
  userId: string,
  userType: string,
): Promise<string> {
  const tokens = await db('refresh_tokens')
    .where({ user_id: userId, user_type: userType, is_revoked: false })
    .where('expires_at', '>', new Date())
    .select();

  let validRecord: Record<string, unknown> | null = null;
  for (const record of tokens) {
    const match = await bcrypt.compare(oldToken, record.token_hash as string);
    if (match) {
      validRecord = record as Record<string, unknown>;
      break;
    }
  }

  if (!validRecord) {
    throw createError(401, 'TOKEN_INVALID', 'Invalid or expired refresh token');
  }

  await db('refresh_tokens').where({ id: validRecord.id }).update({ is_revoked: true });

  const newToken = randomUUID();
  await saveRefreshToken(userId, userType, newToken);
  return newToken;
}

export async function revokeAllRefreshTokens(userId: string, userType: string): Promise<void> {
  await db('refresh_tokens')
    .where({ user_id: userId, user_type: userType })
    .update({ is_revoked: true });
}

export async function findOrCreateUser(
  phone: string,
  role: 'washerman' | 'customer',
): Promise<{ user: Record<string, unknown>; isNew: boolean }> {
  const table = role === 'washerman' ? 'washermen' : 'customers';
  const existing = await db(table).where({ phone }).whereNull('deleted_at').first();

  if (existing) {
    return { user: existing as Record<string, unknown>, isNew: false };
  }

  return { user: { phone }, isNew: true };
}
