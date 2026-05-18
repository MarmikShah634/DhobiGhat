import { db } from '../../config/database';
import { createError } from '../../middleware/errorHandler';

export interface WashType {
  id: string;
  washerman_id: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PriceItem {
  id: string;
  washerman_id: string;
  item_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PriceGridEntry {
  id: string;
  price_item_id: string;
  wash_type_id: string;
  price_paise: number;
  is_active: boolean;
  updated_at: Date;
}

export interface PricingGridResponse {
  wash_types: WashType[];
  items: Array<{
    id: string;
    item_name: string;
    prices: Record<string, number>; // wash_type_id -> price_paise
  }>;
}

export async function createWashType(washermanId: string, name: string): Promise<WashType> {
  const [washType] = await db('wash_types')
    .insert({ washerman_id: washermanId, name })
    .returning('*');
  return washType as WashType;
}

export async function listWashTypes(washermanId: string): Promise<WashType[]> {
  return db('wash_types')
    .where({ washerman_id: washermanId, is_active: true })
    .orderBy('created_at', 'asc') as Promise<WashType[]>;
}

export async function deleteWashType(washermanId: string, washTypeId: string): Promise<void> {
  const wt = await db('wash_types').where({ id: washTypeId, washerman_id: washermanId }).first();
  if (!wt) throw createError(404, 'NOT_FOUND', 'Wash type not found');

  await db('wash_types').where({ id: washTypeId }).update({ is_active: false });
}

export async function createPriceItem(washermanId: string, itemName: string): Promise<PriceItem> {
  const [item] = await db('price_items')
    .insert({ washerman_id: washermanId, item_name: itemName })
    .returning('*');
  return item as PriceItem;
}

export async function listPriceItems(washermanId: string): Promise<PriceItem[]> {
  return db('price_items')
    .where({ washerman_id: washermanId, is_active: true })
    .orderBy('created_at', 'asc') as Promise<PriceItem[]>;
}

export async function deletePriceItem(washermanId: string, itemId: string): Promise<void> {
  const item = await db('price_items').where({ id: itemId, washerman_id: washermanId }).first();
  if (!item) throw createError(404, 'NOT_FOUND', 'Price item not found');

  await db('price_items').where({ id: itemId }).update({ is_active: false });
}

export async function upsertPriceGrid(
  washermanId: string,
  entries: Array<{ price_item_id: string; wash_type_id: string; price_paise: number }>,
): Promise<void> {
  // Validate that all price_items and wash_types belong to this washerman
  for (const entry of entries) {
    const item = await db('price_items')
      .where({ id: entry.price_item_id, washerman_id: washermanId, is_active: true })
      .first();
    if (!item) throw createError(404, 'NOT_FOUND', `Price item ${entry.price_item_id} not found`);

    const wt = await db('wash_types')
      .where({ id: entry.wash_type_id, washerman_id: washermanId, is_active: true })
      .first();
    if (!wt) throw createError(404, 'NOT_FOUND', `Wash type ${entry.wash_type_id} not found`);
  }

  for (const entry of entries) {
    await db('price_grid')
      .insert({
        price_item_id: entry.price_item_id,
        wash_type_id: entry.wash_type_id,
        price_paise: entry.price_paise,
        updated_at: new Date(),
      })
      .onConflict(['price_item_id', 'wash_type_id'])
      .merge(['price_paise', 'is_active', 'updated_at']);
  }
}

export async function getPricingGrid(washermanId: string): Promise<PricingGridResponse> {
  const washTypes = await listWashTypes(washermanId);
  const items = await listPriceItems(washermanId);

  const gridRows = await db('price_grid')
    .join('price_items', 'price_grid.price_item_id', 'price_items.id')
    .where('price_items.washerman_id', washermanId)
    .where('price_grid.is_active', true)
    .where('price_items.is_active', true)
    .select('price_grid.price_item_id', 'price_grid.wash_type_id', 'price_grid.price_paise');

  const gridMap: Record<string, Record<string, number>> = {};
  for (const row of gridRows) {
    if (!gridMap[row.price_item_id as string]) {
      gridMap[row.price_item_id as string] = {};
    }
    gridMap[row.price_item_id as string][row.wash_type_id as string] = row.price_paise as number;
  }

  return {
    wash_types: washTypes,
    items: items.map((item) => ({
      id: item.id,
      item_name: item.item_name,
      prices: gridMap[item.id] || {},
    })),
  };
}

export async function getPriceGridEntry(
  priceItemId: string,
  washTypeId: string,
): Promise<PriceGridEntry | null> {
  const entry = await db('price_grid')
    .where({ price_item_id: priceItemId, wash_type_id: washTypeId, is_active: true })
    .first();
  return entry ? (entry as PriceGridEntry) : null;
}
