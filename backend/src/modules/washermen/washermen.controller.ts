import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { createError } from '../../middleware/errorHandler';
import { JwtPayload } from '../../middleware/auth';
import {
  registerWashermanSchema,
  updateWashermanSchema,
  searchWashermanSchema,
} from './washermen.schema';
import {
  createWasherman,
  getWashermanById,
  updateWasherman,
  searchWashermen,
  deleteWasherman,
} from './washermen.service';
import { generateTokens, saveRefreshToken } from '../auth/auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerWashermanSchema.parse(req.body);

    // Verify temp token
    let tempPayload: { phone: string; role: string; needsRegistration: boolean };
    try {
      tempPayload = jwt.verify(body.temp_token, env.jwtAccessSecret) as typeof tempPayload;
    } catch {
      throw createError(401, 'TOKEN_INVALID', 'Invalid or expired registration token');
    }

    if (!tempPayload.needsRegistration || tempPayload.role !== 'washerman') {
      throw createError(400, 'VALIDATION_ERROR', 'Invalid registration token');
    }

    if (tempPayload.phone !== body.phone) {
      throw createError(400, 'VALIDATION_ERROR', 'Phone number mismatch');
    }

    const washerman = await createWasherman({
      phone: body.phone,
      name: body.name,
      business_name: body.business_name,
      area: body.area,
      address: body.address,
    });

    const payload: JwtPayload = { id: washerman.id, role: 'washerman', phone: washerman.phone };
    const { access_token, refresh_token } = generateTokens(payload);
    await saveRefreshToken(washerman.id, 'washerman', refresh_token);

    res.status(201).json({ access_token, refresh_token, washerman });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const washerman = await getWashermanById(req.user.id);
    res.json(washerman);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const data = updateWashermanSchema.parse(req.body);
    const washerman = await updateWasherman(req.user.id, data);
    res.json(washerman);
  } catch (error) {
    next(error);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await deleteWasherman(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { area, code, page, limit } = searchWashermanSchema.parse(req.query);
    const result = await searchWashermen(area, code, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const washerman = await getWashermanById(String(req.params.id));
    res.json(washerman);
  } catch (error) {
    next(error);
  }
}
