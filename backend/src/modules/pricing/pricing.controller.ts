import { Request, Response, NextFunction } from 'express';
import { createError } from '../../middleware/errorHandler';
import {
  createWashTypeSchema,
  createPriceItemSchema,
  bulkUpsertPriceGridSchema,
} from './pricing.schema';
import {
  createWashType,
  listWashTypes,
  deleteWashType,
  createPriceItem,
  listPriceItems,
  deletePriceItem,
  upsertPriceGrid,
  getPricingGrid,
} from './pricing.service';

export async function addWashType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { name } = createWashTypeSchema.parse(req.body);
    const washType = await createWashType(req.user.id, name);
    res.status(201).json(washType);
  } catch (error) {
    next(error);
  }
}

export async function getWashTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const washTypes = await listWashTypes(req.user.id);
    res.json(washTypes);
  } catch (error) {
    next(error);
  }
}

export async function removeWashType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await deleteWashType(req.user.id, String(req.params.id));
    res.json({ message: 'Wash type removed' });
  } catch (error) {
    next(error);
  }
}

export async function addPriceItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { item_name } = createPriceItemSchema.parse(req.body);
    const item = await createPriceItem(req.user.id, item_name);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function getPriceItems(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const items = await listPriceItems(req.user.id);
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function removePriceItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    await deletePriceItem(req.user.id, String(req.params.id));
    res.json({ message: 'Price item removed' });
  } catch (error) {
    next(error);
  }
}

export async function setPrices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { entries } = bulkUpsertPriceGridSchema.parse(req.body);
    await upsertPriceGrid(req.user.id, entries);
    const grid = await getPricingGrid(req.user.id);
    res.json(grid);
  } catch (error) {
    next(error);
  }
}

export async function getGrid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const washermanId = req.params.washermanId ? String(req.params.washermanId) : req.user?.id;
    if (!washermanId) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const grid = await getPricingGrid(washermanId);
    res.json(grid);
  } catch (error) {
    next(error);
  }
}
