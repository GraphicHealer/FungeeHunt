import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { verifyPlayerToken } from '../lib/auth';

export async function playerAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = verifyPlayerToken(token);
    const game = await db.game.findUnique({ where: { code: req.params.code } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const player = await db.player.findFirst({
      where: { id: payload.playerId, gameId: game.id, sessionToken: token },
      include: {
        team: {
          include: { members: true, manager: true },
        },
      },
    });
    if (!player) throw new Error('player not found');

    (res.locals as any).player = player;
    (res.locals as any).game = game;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
