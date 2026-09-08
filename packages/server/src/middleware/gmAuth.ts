import type { Request, Response, NextFunction } from 'express';
import { verifyGmToken } from '../lib/auth';

// req.params is not populated for params in an app.use()/router.use() mount path, so fall back to the URL.
function gameIdFromUrl(url: string): string | undefined {
  const m = /^\/api\/gm\/games\/([^/?#]+)/.exec(url);
  return m ? decodeURIComponent(m[1]) : undefined;
}

export function gmAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyGmToken(token);
    (res.locals as any).gm = payload;
    const gameId: string | undefined =
      (req.params as any).gameId ?? gameIdFromUrl(req.originalUrl) ?? (req.body as any)?.gameId;
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
