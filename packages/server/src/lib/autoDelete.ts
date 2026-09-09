import type { Server } from 'socket.io';
import { db } from '../db/client';
import { logger } from './logger';
import { deleteGame } from './deleteGame';
import { emailReady, sendGameDeleteWarningEmail, sendGameReminderEmail, gameBaseUrl } from './email';
import { createGmToken } from './auth';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const REMINDER_WINDOW_MS = 2 * 60 * 60 * 1000;

function gmLink(game: { id: string; baseUrl?: string | null }) {
  const base = gameBaseUrl(game);
  return base ? `${base}/gm/${game.id}/dashboard?key=${createGmToken(game.id)}` : undefined;
}

/** Sends the "game starts in ~2 hours" reminder once per game. */
async function sweepStartReminders() {
  const soon = new Date(Date.now() + REMINDER_WINDOW_MS);
  const games = await db.game.findMany({
    where: {
      gmEmail: { not: null },
      gmReminderSent: false,
      status: 'NOT_STARTED',
      startAt: { not: null, lte: soon },
    },
  });
  for (const game of games) {
    try {
      await sendGameReminderEmail(game as any, gmLink(game));
      await db.game.update({ where: { id: game.id }, data: { gmReminderSent: true } });
      logger.info(`Sent start reminder for game ${game.code} (${game.name})`);
    } catch (err) {
      logger.error(`start reminder failed for game ${game.code}`, err);
    }
  }
}

/** Warns once, roughly an hour before a game becomes eligible for auto-delete. */
async function sweepDeleteWarnings(hours: number, cutoff: Date) {
  const warnHours = Math.max(hours - 1, 0);
  const warnCutoff = new Date(Date.now() - warnHours * 60 * 60 * 1000);
  const games = await db.game.findMany({
    where: {
      gmEmail: { not: null },
      gmDeleteWarned: false,
      endAt: { not: null, lt: warnCutoff, gte: cutoff },
    },
  });
  for (const game of games) {
    try {
      const deleteAt = new Date(game.endAt!.getTime() + hours * 60 * 60 * 1000);
      const base = gameBaseUrl(game);
      const archiveLink = base ? `${base}/view/${game.code}` : undefined;
      await sendGameDeleteWarningEmail(game as any, deleteAt, archiveLink);
      await db.game.update({ where: { id: game.id }, data: { gmDeleteWarned: true } });
      logger.info(`Sent delete warning for game ${game.code} (${game.name})`);
    } catch (err) {
      logger.error(`delete warning failed for game ${game.code}`, err);
    }
  }
}

/** Deletes games whose end time is older than the configured retention, in hours. */
export async function sweepExpiredGames(io?: Server) {
  try {
    const mailReady = await emailReady();
    if (mailReady) await sweepStartReminders();

    const settings = await db.systemSettings.findFirst({ select: { autoDeleteHours: true } });
    const hours = settings?.autoDeleteHours ?? 0;
    if (hours <= 0) return;

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    if (mailReady) await sweepDeleteWarnings(hours, cutoff);

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
