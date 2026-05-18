import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { db } from '../../config/database';
import { createError } from '../../middleware/errorHandler';
import { formatPaise } from '../../utils/paise';

export interface AccountingSummary {
  period_start: string;
  period_end: string;
  total_orders: number;
  delivered_orders: number;
  total_revenue_paise: number;
  paid_revenue_paise: number;
  unpaid_revenue_paise: number;
  avg_order_value_paise: number;
}

export async function getAccountingSummary(
  washermanId: string,
  startDate: string,
  endDate: string,
): Promise<AccountingSummary> {
  const orders = await db('orders')
    .where({ washerman_id: washermanId })
    .whereBetween('created_at', [new Date(startDate), new Date(endDate + 'T23:59:59')])
    .whereNotIn('status', ['declined', 'cancelled'])
    .select('*');

  const delivered = orders.filter((o) => o.status === 'delivered');
  const totalRevenuePaise = delivered.reduce((sum, o) => sum + (o.total_paise as number), 0);
  const paidRevenuePaise = delivered
    .filter((o) => o.is_paid)
    .reduce((sum, o) => sum + (o.total_paise as number), 0);

  return {
    period_start: startDate,
    period_end: endDate,
    total_orders: orders.length,
    delivered_orders: delivered.length,
    total_revenue_paise: totalRevenuePaise,
    paid_revenue_paise: paidRevenuePaise,
    unpaid_revenue_paise: totalRevenuePaise - paidRevenuePaise,
    avg_order_value_paise:
      delivered.length > 0 ? Math.round(totalRevenuePaise / delivered.length) : 0,
  };
}

export async function generateOrderReceiptPdf(orderId: string): Promise<Buffer> {
  const order = await db('orders').where({ id: orderId }).first();
  if (!order) throw createError(404, 'NOT_FOUND', 'Order not found');

  const items = await db('order_items').where({ order_id: orderId });
  const customer = await db('customers').where({ id: order.customer_id }).first();
  const washerman = await db('washermen').where({ id: order.washerman_id }).first();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    const stream = new PassThrough();

    doc.pipe(stream);
    stream.on('data', (chunk: Buffer) => buffers.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
    stream.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('DhobiGhat', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Laundry Service Receipt', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Order Info
    doc.fontSize(10);
    doc.text(`Order Number: ${order.order_number as string}`);
    doc.text(`Date: ${new Date(order.created_at as Date).toLocaleDateString('en-IN')}`);
    doc.text(`Pickup Date: ${order.pickup_date as string}`);
    doc.text(`Delivery Mode: ${(order.delivery_mode as string).replace('_', ' ')}`);
    doc.text(`Status: ${order.status as string}`);
    doc.moveDown();

    // Customer & Washerman
    doc.font('Helvetica-Bold').text('Customer:');
    doc.font('Helvetica').text(`${customer?.name as string} | ${customer?.phone as string}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Washerman:');
    doc
      .font('Helvetica')
      .text(
        `${washerman?.name as string} (${washerman?.business_name as string}) | ${washerman?.phone as string}`,
      );
    doc.moveDown();

    // Items table
    doc.font('Helvetica-Bold').text('Items:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colX = [50, 200, 320, 420, 520];

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item', colX[0], tableTop);
    doc.text('Wash Type', colX[1], tableTop);
    doc.text('Unit Price', colX[2], tableTop);
    doc.text('Qty', colX[3], tableTop);
    doc.text('Subtotal', colX[4], tableTop);

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    for (const item of items) {
      const y = doc.y;
      doc.text(item.item_name_snapshot as string, colX[0], y);
      doc.text(item.wash_type_snapshot as string, colX[1], y);
      doc.text(formatPaise(item.unit_price_paise as number), colX[2], y);
      doc.text(String(item.quantity), colX[3], y);
      doc.text(formatPaise(item.subtotal_paise as number), colX[4], y);
      doc.moveDown();
    }

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Total
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Total: ${formatPaise(order.total_paise as number)}`, { align: 'right' });
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Payment Status: ${(order.is_paid as boolean) ? 'Paid' : 'Unpaid'}`, {
        align: 'right',
      });

    if (order.notes) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Notes:');
      doc.font('Helvetica').text(order.notes as string);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('grey').text('Thank you for using DhobiGhat!', { align: 'center' });

    doc.end();
  });
}

export async function generateStatementPdf(
  washermanId: string,
  startDate: string,
  endDate: string,
): Promise<Buffer> {
  const washerman = await db('washermen').where({ id: washermanId }).first();
  if (!washerman) throw createError(404, 'NOT_FOUND', 'Washerman not found');

  const orders = await db('orders')
    .where({ washerman_id: washermanId, status: 'delivered' })
    .whereBetween('created_at', [new Date(startDate), new Date(endDate + 'T23:59:59')])
    .orderBy('created_at', 'asc')
    .select('*');

  const summary = await getAccountingSummary(washermanId, startDate, endDate);

  // Pre-fetch customer names to avoid await inside Promise callback
  const customerIds = [...new Set(orders.map((o) => o.customer_id as string))];
  const customers = await db('customers').whereIn('id', customerIds).select('id', 'name');
  const customerMap: Record<string, string> = {};
  for (const c of customers) {
    customerMap[c.id as string] = c.name as string;
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    const stream = new PassThrough();

    doc.pipe(stream);
    stream.on('data', (chunk: Buffer) => buffers.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
    stream.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('DhobiGhat', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Earnings Statement', { align: 'center' });
    doc.moveDown();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Washerman: ${washerman.name as string}`);
    doc.font('Helvetica').text(`Business: ${washerman.business_name as string}`);
    doc.text(`Period: ${startDate} to ${endDate}`);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Summary box
    doc.font('Helvetica-Bold').fontSize(11).text('Summary');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Total Orders (active): ${summary.total_orders}`);
    doc.text(`Delivered Orders: ${summary.delivered_orders}`);
    doc.text(`Total Revenue: ${formatPaise(summary.total_revenue_paise)}`);
    doc.text(`Collected (Paid): ${formatPaise(summary.paid_revenue_paise)}`);
    doc.text(`Outstanding: ${formatPaise(summary.unpaid_revenue_paise)}`);
    doc.text(`Average Order Value: ${formatPaise(summary.avg_order_value_paise)}`);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Orders table
    doc.font('Helvetica-Bold').fontSize(11).text('Order Details');
    doc.moveDown(0.5);

    const colX = [50, 170, 280, 360, 450, 530];
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Order #', colX[0], doc.y);
    doc.text('Date', colX[1], doc.y);
    doc.text('Customer', colX[2], doc.y);
    doc.text('Amount', colX[3], doc.y);
    doc.text('Paid', colX[4], doc.y);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(8);
    for (const order of orders) {
      const customerName = customerMap[order.customer_id as string] || 'N/A';
      const y = doc.y;
      doc.text(order.order_number as string, colX[0], y);
      doc.text(new Date(order.created_at as Date).toLocaleDateString('en-IN'), colX[1], y);
      doc.text(customerName, colX[2], y);
      doc.text(formatPaise(order.total_paise as number), colX[3], y);
      doc.text((order.is_paid as boolean) ? 'Yes' : 'No', colX[4], y);
      doc.moveDown();
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('grey').text('Generated by DhobiGhat', { align: 'center' });
    doc.end();
  });
}
