import type { Request, Response, NextFunction } from 'express';
import { getClientIp, isBanned, ipBanMessage } from '../lib/ipBan';

export function ipBanMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  if (isBanned(ip)) {
    return res.status(403).json({ error: ipBanMessage(ip) });
  }
  next();
}
