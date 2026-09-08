import type { Server } from 'socket.io';
import { db } from '../db/client';
import { logger } from './logger';
import { deleteGame } from './deleteGame';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/** Deletes games whose end time is older than the configured retention, in hours. */
export async function sweepExpiredGames(io?: Server) {
  try {
    const settings = await db.systemSettings.findFirst({ select: { autoDeleteHours: true } });
    const hours = settings?.autoDeleteHours ?? 0;
    if (hours <= 0) return;

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const expired = await db.game.findMany({
      where: { endAt: { not: null, lt: cutoff } },
      select: { id: true, code: true, name: true },
    });

    for (const game of expired) {
      try {
        await deleteGame(game.id, io);
        logger.info(`Auto-deleted game ${game.code} (${game.name}) ${hours} hour(s) after end`);
      } catch (err) {
        logger.error(`auto-delete failed for game ${game.code}`, err);
      }
    }
  } catch (err) {
    logger.error('auto-delete sweep failed', err);
  }
}

export function startAutoDeleteSweep(io?: Server) {
  sweepExpiredGames(io);
  setInterval(() => sweepExpiredGames(io), SWEEP_INTERVAL_MS);
}
