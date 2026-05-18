import { db } from '../../config/database';
import { createError } from '../../middleware/errorHandler';
import { generateUniqueCode } from '../../utils/uniqueCode';

export interface WashermanProfile {
  id: string;
  phone: string;
  name: string;
  business_name: string;
  area: string;
  address: string | null;
  profile_photo_url: string | null;
  unique_code: string;
  is_available: boolean;
  avg_rating: number;
  review_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createWasherman(data: {
  phone: string;
  name: string;
  business_name: string;
  area: string;
  address?: string;
}): Promise<WashermanProfile> {
  // Generate unique code ensuring no collision
  let unique_code: string;
  let attempts = 0;
  do {
    unique_code = generateUniqueCode();
    attempts++;
    if (attempts > 10) throw createError(500, 'INTERNAL_ERROR', 'Failed to generate unique code');
  } while (await db('washermen').where({ unique_code }).first());

  const [washerman] = await db('washermen')
    .insert({
      phone: data.phone,
      name: data.name,
      business_name: data.business_name,
      area: data.area,
      address: data.address || null,
      unique_code,
    })
    .returning('*');

  return washerman as WashermanProfile;
}

export async function getWashermanById(id: string): Promise<WashermanProfile> {
  const washerman = await db('washermen').where({ id }).whereNull('deleted_at').first();
  if (!washerman) throw createError(404, 'NOT_FOUND', 'Washerman not found');
  return washerman as WashermanProfile;
}

export async function getWashermanByPhone(phone: string): Promise<WashermanProfile | null> {
  const washerman = await db('washermen').where({ phone }).whereNull('deleted_at').first();
  return washerman ? (washerman as WashermanProfile) : null;
}

export async function updateWasherman(
  id: string,
  data: Partial<{
    name: string;
    business_name: string;
    area: string;
    address: string;
    profile_photo_url: string;
    is_available: boolean;
    fcm_token: string;
  }>,
): Promise<WashermanProfile> {
  const [updated] = await db('washermen')
    .where({ id })
    .whereNull('deleted_at')
    .update({ ...data, updated_at: new Date() })
    .returning('*');

  if (!updated) throw createError(404, 'NOT_FOUND', 'Washerman not found');
  return updated as WashermanProfile;
}

export async function searchWashermen(
  area?: string,
  code?: string,
  page = 1,
  limit = 20,
): Promise<{ data: WashermanProfile[]; total: number; page: number; limit: number }> {
  let query = db('washermen').whereNull('deleted_at').where({ is_active: true });

  if (area) {
    query = query.whereILike('area', `%${area}%`);
  }
  if (code) {
    query = query.where({ unique_code: code.toUpperCase() });
  }

  const countResult = await query.clone().count('id as count').first();
  const total = parseInt(String(countResult?.count || 0), 10);

  const data = await query
    .select('*')
    .orderBy('avg_rating', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);

  return { data: data as WashermanProfile[], total, page, limit };
}

export async function deleteWasherman(id: string): Promise<void> {
  await db('washermen')
    .where({ id })
    .update({ deleted_at: new Date(), is_active: false, updated_at: new Date() });
}
