import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createError } from './errorHandler';

export interface JwtPayload {
  id: string;
  role: 'washerman' | 'customer';
  phone: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(createError(401, 'TOKEN_INVALID', 'No token provided'));
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      next(createError(401, 'TOKEN_EXPIRED', 'Access token expired'));
    } else {
      next(createError(401, 'TOKEN_INVALID', 'Invalid token'));
    }
  }
}

export function requireRole(role: 'washerman' | 'customer') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError(401, 'TOKEN_INVALID', 'Not authenticated'));
      return;
    }
    if (req.user.role !== role) {
      next(createError(403, 'FORBIDDEN', `Only ${role}s can perform this action`));
      return;
    }
    next();
  };
}
