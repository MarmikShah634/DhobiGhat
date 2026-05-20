import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createError } from '../../middleware/errorHandler';
import {
  getAccountingSummary,
  generateOrderReceiptPdf,
  generateStatementPdf,
} from './accounting.service';

const periodSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { start_date, end_date } = periodSchema.parse(req.query);
    const summary = await getAccountingSummary(req.user.id, start_date, end_date);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function downloadReceipt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const orderId = String(req.params.orderId);
    const pdfBuffer = await generateOrderReceiptPdf(orderId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${orderId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export async function downloadStatement(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw createError(401, 'TOKEN_INVALID', 'Not authenticated');
    const { start_date, end_date } = periodSchema.parse(req.query);
    const pdfBuffer = await generateStatementPdf(req.user.id, start_date, end_date);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="statement-${start_date}-${end_date}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
