import { Router } from 'express';
import { db } from '../db/client';
import { createPlayerToken } from '../lib/auth';

const router = Router();

router.post('/', async (req, res) => {
  const { code, displayName, hasCar } = req.body ?? {};
  const trimmed = displayName ? displayName.trim() : '';
  if (!code || !trimmed) {
    return res.status(400).json({ error: 'Game code and display name are required' });
  }

  try {
    const game = await db.game.findUnique({ where: { code: code.toUpperCase() } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    let player = await db.player.findFirst({
      where: {
        gameId: game.id,
        displayName: { equals: trimmed, mode: 'insensitive' },
      },
    });

    if (!player) {
      player = await db.player.create({
        data: {
          gameId: game.id,
          displayName: trimmed,
          type: 'APP',
          hasCar: !!hasCar,
        },
      });
    }

    const token = player.sessionToken ?? createPlayerToken(player.id, game.id);
    if (!player.sessionToken) {
      await db.player.update({
        where: { id: player.id },
        data: { sessionToken: token },
      });
    }

    res.json({ token, player, game });
  } catch (err) {
    console.error('join failed', err);
    res.status(500).json({ error: 'Could not join game' });
  }
});

export default router;
