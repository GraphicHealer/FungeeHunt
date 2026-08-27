import { Router } from 'express';
import { db } from '../db/client';
import { getRecapPlan, startRecapRender, updateRecapStatus } from '../lib/recap';

const router = Router({ mergeParams: true });

router.get('/', async (req: any, res: any) => {
  const { gameId } = req.params;
  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
      select: { recapVideoStatus: true, recapVideoUrl: true },
    });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const plan = await getRecapPlan(gameId);
    res.json({
      status: game.recapVideoStatus,
      url: game.recapVideoUrl,
      plan,
    });
  } catch (err) {
    console.error('get recap failed', err);
    res.status(500).json({ error: 'Could not load recap' });
  }
});

router.post('/', async (req: any, res: any) => {
  const { gameId } = req.params;
  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
      select: { status: true, recapVideoStatus: true },
    });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Recap can only be generated for a completed game' });
    }
    if (game.recapVideoStatus === 'RENDERING') {
      return res.status(409).json({ error: 'Recap is already rendering' });
    }

    startRecapRender(gameId);
    res.json({ status: 'RENDERING' });
  } catch (err) {
    console.error('start recap failed', err);
    res.status(500).json({ error: 'Could not start recap' });
  }
});

router.delete('/', async (req: any, res: any) => {
  const { gameId } = req.params;
  try {
    await updateRecapStatus(gameId, 'PENDING');
    res.json({ status: 'PENDING' });
  } catch (err) {
    console.error('reset recap failed', err);
    res.status(500).json({ error: 'Could not reset recap' });
  }
});

export default router;
