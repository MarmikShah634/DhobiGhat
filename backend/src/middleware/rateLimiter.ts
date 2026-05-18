import rateLimit from 'express-rate-limit';
import { createError } from './errorHandler';

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => `${req.ip}-${(req.body as Record<string, string>)?.phone || ''}`,
  handler: (_req, _res, next) => {
    next(createError(429, 'RATE_LIMIT_EXCEEDED', 'Too many OTP requests. Try again in 1 hour.'));
  },
  skip: () => process.env.NODE_ENV === 'test',
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  skip: () => process.env.NODE_ENV === 'test',
});
