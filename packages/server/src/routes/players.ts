import { Router } from 'express';
import { db } from '../db/client';
import { createPlayerToken } from '../lib/auth';
import { getBaseUrl } from '../lib/urls';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { gameId } = req.params;
  try {
    const players = await db.player.findMany({
      where: { gameId },
      include: { team: { select: { id: true, name: true, managerId: true } } },
      orderBy: { joinedAt: 'desc' },
    });
    res.json(players);
  } catch (err) {
    console.error('list players failed', err);
    res.status(500).json({ error: 'Could not list players' });
  }
});

router.post('/offline', async (req, res) => {
  const { gameId } = req.params;
  const { displayName } = req.body ?? {};
  const trimmed = displayName ? displayName.trim() : '';
  if (!trimmed) return res.status(400).json({ error: 'Display name is required' });

  try {
    const existing = await db.player.findFirst({
      where: {
        gameId,
        displayName: { equals: trimmed, mode: 'insensitive' },
      },
    });
    if (existing) return res.status(400).json({ error: 'A player with that name already exists' });

    const player = await db.player.create({
      data: {
        gameId,
        displayName: trimmed,
        type: 'OFFLINE',
      },
    });
    res.status(201).json(player);
  } catch (err) {
    console.error('add offline player failed', err);
    res.status(500).json({ error: 'Could not add offline player' });
  }
});

router.post('/:playerId/reissue', async (req, res) => {
  const { gameId, playerId } = req.params;
  try {
    const player = await db.player.findFirst({
      where: { id: playerId, gameId, type: 'APP' },
    });
    if (!player) return res.status(404).json({ error: 'App player not found' });

    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const token = createPlayerToken(player.id, game.id);
    await db.player.update({
      where: { id: playerId },
      data: { sessionToken: token },
    });

    res.json({
      joinUrl: `${getBaseUrl(req)}/play/${game.code}?token=${token}`,
    });
  } catch (err) {
    console.error('reissue join link failed', err);
    res.status(500).json({ error: 'Could not reissue join link' });
  }
});

router.delete('/:playerId', async (req, res) => {
  const { gameId, playerId } = req.params;
  try {
    const player = await db.player.findFirst({
      where: { id: playerId, gameId },
      include: { team: true },
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (player.team && player.team.managerId === playerId) {
      return res.status(400).json({ error: 'Cannot delete a team manager' });
    }
    await db.player.delete({ where: { id: playerId } });
    res.status(204).end();
  } catch (err) {
    console.error('delete player failed', err);
    res.status(500).json({ error: 'Could not delete player' });
  }
});

export default router;
