import { Request, Response, NextFunction } from 'express';
import { createError } from '../../middleware/errorHandler';
import {
  createOrderSchema,
  acceptOrderSchema,
  declineOrderSchema,
  listOrdersSchema,
} from './orders.schema';
import {
  createOrder,
  getOrderWithItems,
  listOrdersForCustomer,
  listOrdersForWasherman,
  transitionOrderStatus,
  markOrderPaid,
} from './orders.service';
import { sendNotification } from '../notifications/notifications.service';

export async function placeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const data = createOrderSchema.parse(req.body);
    const order = await createOrder(req.user.id, data);

    await sendNotification(
      'washerman',
      order.washerman_id,
      order.id,
      'New Order Received',
      `Order ${order.order_number} received from a customer`,
      { order_id: order.id, type: 'new_order' },
    );

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const order = await getOrderWithItems(String(req.params.id), req.user.id, req.user.role);
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { status, page, limit } = listOrdersSchema.parse(req.query);

    let result;
    if (req.user.role === 'customer') {
      result = await listOrdersForCustomer(req.user.id, status, page, limit);
    } else {
      result = await listOrdersForWasherman(req.user.id, status, page, limit);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function acceptOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { pickup_date } = acceptOrderSchema.parse(req.body);
    const order = await transitionOrderStatus(
      String(req.params.id),
      'accepted',
      'washerman',
      req.user.id,
      pickup_date ? { pickup_date } : undefined,
    );
    await sendNotification(
      'customer',
      order.customer_id,
      order.id,
      'Order Accepted',
      `Your order ${order.order_number} has been accepted`,
      { order_id: order.id, type: 'order_accepted' },
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function declineOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { reason } = declineOrderSchema.parse(req.body);
    const order = await transitionOrderStatus(
      String(req.params.id),
      'declined',
      'washerman',
      req.user.id,
      { reason },
    );
    await sendNotification(
      'customer',
      order.customer_id,
      order.id,
      'Order Declined',
      `Your order ${order.order_number} was declined: ${reason}`,
      { order_id: order.id, type: 'order_declined' },
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const order = await transitionOrderStatus(
      String(req.params.id),
      'cancelled',
      'customer',
      req.user.id,
    );
    await sendNotification(
      'washerman',
      order.washerman_id,
      order.id,
      'Order Cancelled',
      `Order ${order.order_number} was cancelled by the customer`,
      { order_id: order.id, type: 'order_cancelled' },
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function startCollecting(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const order = await transitionOrderStatus(
      String(req.params.id),
      'collecting',
      'washerman',
      req.user.id,
    );
    await sendNotification(
      'customer',
      order.customer_id,
      order.id,
      'Washerman On the Way',
      `Your washerman is coming to collect your laundry for order ${order.order_number}`,
      { order_id: order.id, type: 'collecting' },
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function confirmCollection(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const order = await transitionOrderStatus(
      String(req.params.id),
      'collected',
      req.user.role,
      req.user.id,
    );
    if (order.status === 'collected') {
      await sendNotification(
        'customer',
        order.customer_id,
        order.id,
        'Laundry Collected',
        `Your laundry for order ${order.order_number} has been collected`,
        { order_id: order.id, type: 'collected' },
      );
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function startProcessing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const order = await transitionOrderStatus(
      String(req.params.id),
      'in_progress',
      'washerman',
      req.user.id,
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function markReady(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const order = await transitionOrderStatus(
      String(req.params.id),
      'ready',
      'washerman',
      req.user.id,
    );
    await sendNotification(
      'customer',
      order.customer_id,
      order.id,
      'Laundry Ready',
      `Your laundry for order ${order.order_number} is ready for delivery`,
      { order_id: order.id, type: 'ready' },
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function markDelivered(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const order = await transitionOrderStatus(
      String(req.params.id),
      'delivered',
      'washerman',
      req.user.id,
    );
    await sendNotification(
      'customer',
      order.customer_id,
      order.id,
      'Order Delivered',
      `Your order ${order.order_number} has been delivered. Please rate your experience!`,
      { order_id: order.id, type: 'delivered' },
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function recordPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const order = await markOrderPaid(String(req.params.id));
    res.json(order);
  } catch (error) {
    next(error);
  }
}
