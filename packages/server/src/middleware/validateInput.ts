import type { Request, Response, NextFunction } from 'express';
import { checkBody } from '../lib/limits';

const METHODS = new Set(['POST', 'PATCH', 'PUT']);

export function validateInput(req: Request, res: Response, next: NextFunction) {
  if (!METHODS.has(req.method) || !req.body || typeof req.body !== 'object') {
    return next();
  }
  const error = checkBody(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  next();
}
