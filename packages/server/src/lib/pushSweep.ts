import { db } from '../db/client';
import { sendPushToCaptains } from './push';

const INTERVAL_MS = 30 * 1000;

export function startPushSweep() {
  setInterval(async () => {
    try {
      const now = new Date();
      const games = await db.game.findMany({
        where: {
          status: 'LIVE',
          bonusStart: { lte: now },
          bonusEnd: { gte: now },
          bonusPushSent: false,
        },
      });
      for (const game of games) {
        try {
          await sendPushToCaptains(
            game.id,
            'Bonus task available!',
            'A limited-time bonus task has appeared. Open the app to claim it.',
            `/play/${game.code}`,
          );
          await db.game.update({ where: { id: game.id }, data: { bonusPushSent: true } });
        } catch (err) {
          console.error('bonus push sweep failed for game', game.id, err);
        }
      }
    } catch (err) {
      console.error('push sweep failed', err);
    }
  }, INTERVAL_MS);
}
