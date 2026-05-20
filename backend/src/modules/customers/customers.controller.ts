import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { createError } from '../../middleware/errorHandler';
import { JwtPayload } from '../../middleware/auth';
import {
  registerCustomerSchema,
  updateCustomerSchema,
  selectWashermanSchema,
} from './customers.schema';
import {
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getFavourites,
  addFavourite,
  removeFavourite,
} from './customers.service';
import { generateTokens, saveRefreshToken } from '../auth/auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerCustomerSchema.parse(req.body);

    let tempPayload: { phone: string; role: string; needsRegistration: boolean };
    try {
      tempPayload = jwt.verify(body.temp_token, env.jwtAccessSecret) as typeof tempPayload;
    } catch {
      throw createError(401, 'TOKEN_INVALID', 'Invalid or expired registration token');
    }

    if (!tempPayload.needsRegistration || tempPayload.role !== 'customer') {
      throw createError(400, 'VALIDATION_ERROR', 'Invalid registration token');
    }

    if (tempPayload.phone !== body.phone) {
      throw createError(400, 'VALIDATION_ERROR', 'Phone number mismatch');
    }

    const customer = await createCustomer({
      phone: body.phone,
      name: body.name,
      address: body.address,
    });

    const payload: JwtPayload = { id: customer.id, role: 'customer', phone: customer.phone };
    const { access_token, refresh_token } = generateTokens(payload);
    await saveRefreshToken(customer.id, 'customer', refresh_token);

    res.status(201).json({ access_token, refresh_token, customer });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const customer = await getCustomerById(req.user.id);
    res.json(customer);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const data = updateCustomerSchema.parse(req.body);
    const customer = await updateCustomer(req.user.id, data);
    res.json(customer);
  } catch (error) {
    next(error);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await deleteCustomer(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function selectWasherman(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { washerman_id } = selectWashermanSchema.parse(req.body);
    const customer = await updateCustomer(req.user.id, { selected_washerman_id: washerman_id });
    res.json(customer);
  } catch (error) {
    next(error);
  }
}

export async function listFavourites(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const favourites = await getFavourites(req.user.id);
    res.json(favourites);
  } catch (error) {
    next(error);
  }
}

export async function addToFavourites(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await addFavourite(req.user.id, String(req.params.washermanId));
    res.status(201).json({ message: 'Added to favourites' });
  } catch (error) {
    next(error);
  }
}

export async function removeFromFavourites(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await removeFavourite(req.user.id, String(req.params.washermanId));
    res.json({ message: 'Removed from favourites' });
  } catch (error) {
    next(error);
  }
}
