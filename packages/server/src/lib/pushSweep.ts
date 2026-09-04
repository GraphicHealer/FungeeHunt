import { db } from '../db/client';
import { sendPushToCaptains } from './push';

const SWEEP_INTERVAL_MS = 30 * 1000;
const scheduled = new Map<string, ReturnType<typeof setTimeout>>();

async function sendBonusPush(gameId: string) {
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game || game.status !== 'LIVE' || !game.bonusStart || !game.bonusEnd || game.bonusPushSent) return;
    const now = Date.now();
    if (now < new Date(game.bonusStart).getTime() || now > new Date(game.bonusEnd).getTime()) return;
    await sendPushToCaptains(
      game.id,
      'Bonus task available!',
      'A limited-time bonus task has appeared. Open the app to claim it.',
      `/play/${game.code}`,
    );
    await db.game.update({ where: { id: game.id }, data: { bonusPushSent: true } });
  } catch (err) {
    console.error('bonus push sweep failed for game', gameId, err);
  } finally {
    scheduled.delete(gameId);
  }
}

export async function scheduleBonusPushForGame(gameId: string) {
  const existing = scheduled.get(gameId);
  if (existing) clearTimeout(existing);
  scheduled.delete(gameId);

  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game || game.status !== 'LIVE' || !game.bonusStart || !game.bonusEnd || game.bonusPushSent) return;

  const now = Date.now();
  const start = new Date(game.bonusStart).getTime();
  const end = new Date(game.bonusEnd).getTime();

  if (now >= start && now <= end) {
    await sendBonusPush(gameId);
  } else if (now < start) {
    const timeout = setTimeout(() => sendBonusPush(gameId), start - now);
    scheduled.set(gameId, timeout);
  }
}

async function scheduleActiveGames() {
  try {
    const live = await db.game.findMany({
      where: {
        status: 'LIVE',
        bonusStart: { not: null },
        bonusEnd: { not: null },
      },
    });
    await Promise.all(live.map((g: any) => scheduleBonusPushForGame(g.id)));
  } catch (err) {
    console.error('schedule bonus pushes failed', err);
  }
}

export function startPushSweep() {
  scheduleActiveGames();
  setInterval(scheduleActiveGames, SWEEP_INTERVAL_MS);
}
