import { db } from '../../config/database';
import { createError } from '../../middleware/errorHandler';
import { generateOrderNumber } from '../../utils/orderNumber';
import { getPriceGridEntry } from '../pricing/pricing.service';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'collecting'
  | 'collected'
  | 'in_progress'
  | 'ready'
  | 'delivered';

export type DeliveryMode = 'door_to_door' | 'drop_off';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  washerman_id: string;
  status: OrderStatus;
  delivery_mode: DeliveryMode;
  pickup_date: string;
  notes: string | null;
  total_paise: number;
  is_paid: boolean;
  paid_at: Date | null;
  decline_reason: string | null;
  washerman_collected_confirmed: boolean;
  customer_collected_confirmed: boolean;
  washerman_collected_at: Date | null;
  customer_collected_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Valid status transitions per actor
// washerman transitions
const WASHERMAN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'declined'],
  accepted: ['collecting', 'in_progress'], // in_progress for drop_off
  declined: [],
  cancelled: [],
  collecting: ['collected'],
  collected: ['in_progress'],
  in_progress: ['ready'],
  ready: ['delivered'],
  delivered: [],
};

// customer transitions
const CUSTOMER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['cancelled'],
  accepted: ['cancelled', 'collecting'], // collecting for door_to_door customer confirm
  declined: [],
  cancelled: [],
  collecting: ['collected'],
  collected: [],
  in_progress: [],
  ready: [],
  delivered: [],
};

function canTransition(
  current: OrderStatus,
  next: OrderStatus,
  actor: 'washerman' | 'customer',
): boolean {
  const transitions = actor === 'washerman' ? WASHERMAN_TRANSITIONS : CUSTOMER_TRANSITIONS;
  return (transitions[current] || []).includes(next);
}

export async function createOrder(
  customerId: string,
  data: {
    washerman_id: string;
    delivery_mode: DeliveryMode;
    pickup_date: string;
    notes?: string;
    items: Array<{ price_grid_id: string; quantity: number }>;
  },
): Promise<Order> {
  // Validate washerman exists
  const washerman = await db('washermen')
    .where({ id: data.washerman_id, is_active: true })
    .whereNull('deleted_at')
    .first();
  if (!washerman) throw createError(404, 'NOT_FOUND', 'Washerman not found');

  // Validate and price items
  const orderItems: Array<{
    price_grid_id: string;
    item_name_snapshot: string;
    wash_type_snapshot: string;
    unit_price_paise: number;
    quantity: number;
    subtotal_paise: number;
  }> = [];

  let total_paise = 0;

  for (const item of data.items) {
    const gridRow = await db('price_grid')
      .join('price_items', 'price_grid.price_item_id', 'price_items.id')
      .join('wash_types', 'price_grid.wash_type_id', 'wash_types.id')
      .where('price_grid.id', item.price_grid_id)
      .where('price_grid.is_active', true)
      .where('price_items.washerman_id', data.washerman_id)
      .select(
        'price_grid.id',
        'price_grid.price_paise',
        'price_items.item_name',
        'wash_types.name as wash_type_name',
      )
      .first();

    if (!gridRow) {
      throw createError(
        404,
        'NOT_FOUND',
        `Price grid entry ${item.price_grid_id} not found or inactive`,
      );
    }

    const subtotal_paise = (gridRow.price_paise as number) * item.quantity;
    total_paise += subtotal_paise;

    orderItems.push({
      price_grid_id: item.price_grid_id,
      item_name_snapshot: gridRow.item_name as string,
      wash_type_snapshot: gridRow.wash_type_name as string,
      unit_price_paise: gridRow.price_paise as number,
      quantity: item.quantity,
      subtotal_paise,
    });
  }

  const order_number = generateOrderNumber();

  return db.transaction(async (trx) => {
    const [order] = await trx('orders')
      .insert({
        order_number,
        customer_id: customerId,
        washerman_id: data.washerman_id,
        delivery_mode: data.delivery_mode,
        pickup_date: data.pickup_date,
        notes: data.notes || null,
        total_paise,
        status: 'pending',
      })
      .returning('*');

    const itemsToInsert = orderItems.map((oi) => ({ ...oi, order_id: (order as Order).id }));
    await trx('order_items').insert(itemsToInsert);

    return order as Order;
  });
}

export async function getOrderById(id: string, userId?: string, role?: string): Promise<Order> {
  const order = await db('orders').where({ id }).first();
  if (!order) throw createError(404, 'NOT_FOUND', 'Order not found');

  if (userId && role) {
    if (role === 'customer' && order.customer_id !== userId) {
      throw createError(403, 'FORBIDDEN', 'Not your order');
    }
    if (role === 'washerman' && order.washerman_id !== userId) {
      throw createError(403, 'FORBIDDEN', 'Not your order');
    }
  }

  return order as Order;
}

export async function getOrderWithItems(
  id: string,
  userId?: string,
  role?: string,
): Promise<Record<string, unknown>> {
  const order = await getOrderById(id, userId, role);
  const items = await db('order_items').where({ order_id: id });
  return { ...order, items };
}

export async function listOrdersForCustomer(
  customerId: string,
  status?: OrderStatus,
  page = 1,
  limit = 20,
): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
  let query = db('orders').where({ customer_id: customerId });
  if (status) query = query.where({ status });

  const countResult = await query.clone().count('id as count').first();
  const total = parseInt(String(countResult?.count || 0), 10);

  const data = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);

  return { data: data as Order[], total, page, limit };
}

export async function listOrdersForWasherman(
  washermanId: string,
  status?: OrderStatus,
  page = 1,
  limit = 20,
): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
  let query = db('orders').where({ washerman_id: washermanId });
  if (status) query = query.where({ status });

  const countResult = await query.clone().count('id as count').first();
  const total = parseInt(String(countResult?.count || 0), 10);

  const data = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);

  return { data: data as Order[], total, page, limit };
}

export async function transitionOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  actor: 'washerman' | 'customer',
  actorId: string,
  extra?: Record<string, unknown>,
): Promise<Order> {
  const order = await getOrderById(orderId);

  // Ownership check
  if (actor === 'washerman' && order.washerman_id !== actorId) {
    throw createError(403, 'FORBIDDEN', 'Not your order');
  }
  if (actor === 'customer' && order.customer_id !== actorId) {
    throw createError(403, 'FORBIDDEN', 'Not your order');
  }

  // Handle collection confirmation logic (door_to_door only)
  if (nextStatus === 'collected' && order.delivery_mode === 'door_to_door') {
    const updates: Record<string, unknown> = {};

    if (actor === 'washerman') {
      updates.washerman_collected_confirmed = true;
      updates.washerman_collected_at = new Date();
    } else {
      updates.customer_collected_confirmed = true;
      updates.customer_collected_at = new Date();
    }

    // Check if we currently are in 'collecting' state
    if (order.status !== 'collecting') {
      throw createError(
        422,
        'INVALID_STATUS_TRANSITION',
        `Cannot confirm collection from status '${order.status}'`,
      );
    }

    // Apply individual confirmation
    await db('orders')
      .where({ id: orderId })
      .update({ ...updates, updated_at: new Date() });

    // Check if both confirmed
    const refreshed = await db('orders').where({ id: orderId }).first();
    const washerConfirmed =
      actor === 'washerman' ? true : (refreshed?.washerman_collected_confirmed as boolean);
    const custConfirmed =
      actor === 'customer' ? true : (refreshed?.customer_collected_confirmed as boolean);

    if (washerConfirmed && custConfirmed) {
      const [updated] = await db('orders')
        .where({ id: orderId })
        .update({ status: 'collected', updated_at: new Date() })
        .returning('*');
      return updated as Order;
    }

    return (await db('orders').where({ id: orderId }).first()) as Order;
  }

  // Drop-off: ACCEPTED -> IN_PROGRESS (skip collecting/collected)
  if (
    nextStatus === 'in_progress' &&
    order.status === 'accepted' &&
    order.delivery_mode === 'drop_off'
  ) {
    if (actor !== 'washerman') {
      throw createError(403, 'FORBIDDEN', 'Only washerman can move to in_progress');
    }
    const [updated] = await db('orders')
      .where({ id: orderId })
      .update({ status: 'in_progress', updated_at: new Date() })
      .returning('*');
    return updated as Order;
  }

  if (!canTransition(order.status, nextStatus, actor)) {
    throw createError(
      422,
      'INVALID_STATUS_TRANSITION',
      `Cannot transition from '${order.status}' to '${nextStatus}'`,
    );
  }

  const updateData: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date(),
  };

  if (nextStatus === 'declined' && extra?.reason) {
    updateData.decline_reason = extra.reason;
  }
  if (nextStatus === 'accepted' && extra?.pickup_date) {
    updateData.pickup_date = extra.pickup_date;
  }

  const [updated] = await db('orders').where({ id: orderId }).update(updateData).returning('*');
  return updated as Order;
}

export async function markOrderPaid(orderId: string): Promise<Order> {
  const order = await getOrderById(orderId);
  if (order.status !== 'delivered') {
    throw createError(422, 'INVALID_STATUS', 'Order must be delivered before marking as paid');
  }

  const [updated] = await db('orders')
    .where({ id: orderId })
    .update({ is_paid: true, paid_at: new Date(), updated_at: new Date() })
    .returning('*');
  return updated as Order;
}

// Expose getPriceGridEntry for order creation validation
export { getPriceGridEntry };
