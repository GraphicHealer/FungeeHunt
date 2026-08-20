import type { Request, Response, NextFunction } from 'express';
import { verifyGmToken } from '../lib/auth';

export function gmAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    verifyGmToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
