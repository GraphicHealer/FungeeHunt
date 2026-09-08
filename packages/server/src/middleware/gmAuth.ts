import type { Request, Response, NextFunction } from 'express';
import { verifyGmToken } from '../lib/auth';

function gameIdFromPath(path: string): string | undefined {
  const segments = path.replace(/^\/|\/$/g, '').split('/');
  // API paths are /api/gm/games/{gameId}/...
  return segments[3];
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
    const gameId = (req.params as any).gameId || req.body?.gameId || gameIdFromPath(req.originalUrl.split('?')[0]);
    if (payload.gameId) {
      if (!gameId) {
        console.warn('gmAuth 403: game token on admin path', req.path, 'tokenGameId', payload.gameId);
        return res.status(403).json({ error: 'Game token cannot access admin endpoints' });
      }
      if (gameId !== payload.gameId) {
        console.warn('gmAuth 403: gameId mismatch', { path: req.path, urlGameId: gameId, tokenGameId: payload.gameId });
        return res.status(403).json({ error: 'Token does not match this game' });
      }
    }
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
