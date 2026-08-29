import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { db } from '../db/client';
import { gmAuth } from '../middleware/gmAuth';

const router = Router();

async function generateUniqueCode(attempts = 5): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const code = randomInt(100000, 1000000).toString();
    const existing = await db.spectatorSession.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return null;
}

router.post('/', async (req: any, res: any) => {
  try {
    const code = await generateUniqueCode();
    if (!code) return res.status(500).json({ error: 'Could not generate a code' });
    const session = await db.spectatorSession.create({ data: { code } });
    res.json({ code: session.code });
  } catch (err) {
    console.error('create spectator failed', err);
    res.status(500).json({ error: 'Could not create spectator session' });
  }
});

router.get('/:code', async (req: any, res: any) => {
  try {
    const session = await db.spectatorSession.findUnique({
      where: { code: req.params.code },
      include: { game: true },
    });
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json({ gameCode: session.game?.code ?? null });
  } catch (err) {
    console.error('get spectator failed', err);
    res.status(500).json({ error: 'Could not look up spectator session' });
  }
});

router.post('/:code/pair', gmAuth, async (req: any, res: any) => {
  const { gameId } = req.body ?? {};
  if (!gameId) return res.status(400).json({ error: 'gameId required' });
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const session = await db.spectatorSession.update({
      where: { code: req.params.code },
      data: { gameId },
      include: { game: true },
    });
    res.json({ gameCode: session.game?.code });
  } catch (err) {
    console.error('pair spectator failed', err);
    res.status(500).json({ error: 'Could not pair spectator session' });
  }
});

export default router;
