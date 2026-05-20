import { db } from '../../config/database';
import { createError } from '../../middleware/errorHandler';

export interface CustomerProfile {
  id: string;
  phone: string;
  name: string;
  address: string | null;
  selected_washerman_id: string | null;
  fcm_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createCustomer(data: {
  phone: string;
  name: string;
  address?: string;
}): Promise<CustomerProfile> {
  const [customer] = await db('customers')
    .insert({
      phone: data.phone,
      name: data.name,
      address: data.address || null,
    })
    .returning('*');

  return customer as CustomerProfile;
}

export async function getCustomerById(id: string): Promise<CustomerProfile> {
  const customer = await db('customers').where({ id }).whereNull('deleted_at').first();
  if (!customer) throw createError(404, 'NOT_FOUND', 'Customer not found');
  return customer as CustomerProfile;
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    name: string;
    address: string;
    fcm_token: string;
    selected_washerman_id: string | null;
  }>,
): Promise<CustomerProfile> {
  const [updated] = await db('customers')
    .where({ id })
    .whereNull('deleted_at')
    .update({ ...data, updated_at: new Date() })
    .returning('*');

  if (!updated) throw createError(404, 'NOT_FOUND', 'Customer not found');
  return updated as CustomerProfile;
}

export async function deleteCustomer(id: string): Promise<void> {
  await db('customers').where({ id }).update({ deleted_at: new Date(), updated_at: new Date() });
}

export async function getFavourites(customerId: string): Promise<Record<string, unknown>[]> {
  return db('favourites')
    .join('washermen', 'favourites.washerman_id', 'washermen.id')
    .where('favourites.customer_id', customerId)
    .whereNull('washermen.deleted_at')
    .select(
      'washermen.id',
      'washermen.name',
      'washermen.business_name',
      'washermen.area',
      'washermen.avg_rating',
      'washermen.review_count',
      'washermen.is_available',
      'washermen.profile_photo_url',
      'favourites.created_at as favourited_at',
    );
}

export async function addFavourite(customerId: string, washermanId: string): Promise<void> {
  const washerman = await db('washermen')
    .where({ id: washermanId })
    .whereNull('deleted_at')
    .first();
  if (!washerman) throw createError(404, 'NOT_FOUND', 'Washerman not found');

  await db('favourites')
    .insert({ customer_id: customerId, washerman_id: washermanId })
    .onConflict(['customer_id', 'washerman_id'])
    .ignore();
}

export async function removeFavourite(customerId: string, washermanId: string): Promise<void> {
  await db('favourites').where({ customer_id: customerId, washerman_id: washermanId }).delete();
}
