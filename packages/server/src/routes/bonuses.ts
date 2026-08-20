import { Router } from 'express';
import { db } from '../db/client';

const router = Router({ mergeParams: true });

router.post('/return/:teamId', async (req, res) => {
  const { gameId, teamId } = req.params;
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!game.returnBonusEnabled) {
      return res.status(400).json({ error: 'Return Time Bonus is not enabled' });
    }

    const team = await db.team.findFirst({
      where: { id: teamId, gameId },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const now = new Date();
    const inWindow =
      game.returnStart &&
      game.returnEnd &&
      now >= game.returnStart &&
      now <= game.returnEnd;

    const updated = await db.team.update({
      where: { id: teamId },
      data: {
        returnedAt: now,
        returnBonusAwarded: inWindow,
      },
    });

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'bonus' });

    res.json({
      team: updated,
      inWindow,
      points: inWindow ? game.returnPoints : 0,
    });
  } catch (err) {
    console.error('return bonus failed', err);
    res.status(500).json({ error: 'Could not mark return' });
  }
});

router.post('/food-drive/:teamId', async (req, res) => {
  const { gameId, teamId } = req.params;
  const { items } = req.body ?? {};

  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!game.foodDriveEnabled) {
      return res.status(400).json({ error: 'Food Drive Bonus is not enabled' });
    }

    const team = await db.team.findFirst({
      where: { id: teamId, gameId },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const itemCount = Number(items) || 0;
    const points = itemCount * (game.foodDrivePointsPerItem || 0);

    const updated = await db.team.update({
      where: { id: teamId },
      data: {
        foodDriveItems: itemCount,
        foodDriveBonusAwarded: true,
      },
    });

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'bonus' });

    res.json({
      team: updated,
      points,
    });
  } catch (err) {
    console.error('food drive bonus failed', err);
    res.status(500).json({ error: 'Could not award food drive bonus' });
  }
});

export default router;
