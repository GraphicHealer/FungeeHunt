import { Router } from 'express';
import { db } from '../db/client';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { gameId } = req.params;
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const sections = await db.ruleSection.findMany({
      where: { gameId },
      orderBy: { id: 'asc' },
    });

    res.json(sections);
  } catch (err) {
    console.error('list rules failed', err);
    res.status(500).json({ error: 'Could not list rules' });
  }
});

router.put('/', async (req, res) => {
  const { gameId } = req.params;
  const { sections } = req.body ?? {};
  if (!Array.isArray(sections)) {
    return res.status(400).json({ error: 'sections must be an array' });
  }

  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    await db.$transaction(async (tx) => {
      await tx.ruleSection.deleteMany({ where: { gameId } });
      await tx.ruleSection.createMany({
        data: sections
          .filter((s: any) => s.title || s.body)
          .map((s: any) => ({
            gameId,
            title: s.title ?? '',
            body: s.body ?? '',
          })),
      });
    });

    const updated = await db.ruleSection.findMany({
      where: { gameId },
      orderBy: { id: 'asc' },
    });

    res.json(updated);
  } catch (err) {
    console.error('save rules failed', err);
    res.status(500).json({ error: 'Could not save rules' });
  }
});

export default router;
