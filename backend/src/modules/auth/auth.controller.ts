import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { createError } from '../../middleware/errorHandler';
import { JwtPayload } from '../../middleware/auth';
import { otpRequestSchema, otpVerifySchema, refreshTokenSchema } from './auth.schema';
import {
  sendOtp,
  verifyOtp,
  generateTokens,
  generateAccessToken,
  saveRefreshToken,
  rotateRefreshToken,
  revokeAllRefreshTokens,
  findOrCreateUser,
} from './auth.service';

export async function requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = otpRequestSchema.parse(req.body);
    await sendOtp(phone);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtpAndLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { phone, otp, role, fcm_token } = otpVerifySchema.parse(req.body);

    const isValid = await verifyOtp(phone, otp);
    if (!isValid) {
      throw createError(401, 'OTP_INVALID', 'Invalid or expired OTP');
    }

    const { user, isNew } = await findOrCreateUser(phone, role);

    if (isNew) {
      const tempPayload = { phone, role, needsRegistration: true };
      const tempToken = jwt.sign(tempPayload, env.jwtAccessSecret, { expiresIn: '10m' });
      res.json({ needs_registration: true, temp_token: tempToken });
      return;
    }

    const table = role === 'washerman' ? 'washermen' : 'customers';
    if (fcm_token) {
      await db(table).where({ id: user.id }).update({ fcm_token });
    }

    const payload: JwtPayload = {
      id: user.id as string,
      role,
      phone,
    };
    const { access_token, refresh_token } = generateTokens(payload);
    await saveRefreshToken(payload.id, role, refresh_token);

    res.json({ access_token, refresh_token, user });
  } catch (error) {
    next(error);
  }
}

export async function refreshAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refresh_token, user_id, user_type } = refreshTokenSchema.parse(req.body);

    const newRefreshToken = await rotateRefreshToken(refresh_token, user_id, user_type);

    const table = user_type === 'washerman' ? 'washermen' : 'customers';
    const user = await db(table).where({ id: user_id }).first();
    if (!user) throw createError(404, 'NOT_FOUND', 'User not found');

    const payload: JwtPayload = {
      id: user_id,
      role: user_type as 'washerman' | 'customer',
      phone: user.phone as string,
    };
    const access_token = generateAccessToken(payload);

    res.json({ access_token, refresh_token: newRefreshToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await revokeAllRefreshTokens(req.user.id, req.user.role);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
