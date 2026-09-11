import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { verifyPlayerToken } from '../lib/auth';
import { toSafePlayer, toSafeTeam } from '../lib/safePlayer';
import { getClientIp, recordFailure } from '../lib/ipBan';

export async function playerAuth(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    recordFailure(ip);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = verifyPlayerToken(token);
    const game = await db.game.findUnique({ where: { code: (req.params as any).code.toUpperCase() } });
    if (!game) {
      recordFailure(ip);
      return res.status(404).json({ error: 'Game not found' });
    }

    const player = await db.player.findFirst({
      where: { id: payload.playerId, gameId: game.id, sessionToken: token },
      include: {
        team: {
          include: { members: true, manager: true },
        },
      },
    });
    if (!player) {
      recordFailure(ip);
      throw new Error('player not found');
    }

    (req as any).gameId = game.id;
    (res.locals as any).player = { ...toSafePlayer(player), team: player.team ? toSafeTeam(player.team) : null };
    (res.locals as any).game = game;
    next();
  } catch (err: any) {
    recordFailure(ip);
    res.status(401).json({ error: err?.message ?? 'Unauthorized' });
  }
}

