import type { Request, Response, NextFunction } from 'express';
import { verifyGmToken } from '../lib/auth';

export function gmAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyGmToken(token);
    (res.locals as any).gm = payload;
    const gameId = (req.params as any).gameId;
    if (payload.gameId) {
      if (!gameId) {
        return res.status(403).json({ error: 'Game token cannot access admin endpoints' });
      }
      if (gameId !== payload.gameId) {
        return res.status(403).json({ error: 'Token does not match this game' });
      }
    }
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
