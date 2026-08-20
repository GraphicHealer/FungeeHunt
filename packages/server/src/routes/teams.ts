import { Router } from 'express';
import { db } from '../db/client';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { gameId } = req.params;
  try {
    const teams = await db.team.findMany({
      where: { gameId },
      include: { manager: true, members: true },
    });
    res.json(teams);
  } catch (err) {
    console.error('list teams failed', err);
    res.status(500).json({ error: 'Could not list teams' });
  }
});

router.post('/', async (req, res) => {
  const { gameId } = req.params;
  const { name, managerId, memberIds = [] } = req.body ?? {};
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const manager = await db.player.findFirst({
      where: { id: managerId, gameId, type: 'APP' },
    });
    if (!manager) {
      return res.status(400).json({ error: 'Manager must be an App player in this game' });
    }

    const existingManager = await db.team.findFirst({
      where: { managerId, gameId },
    });
    if (existingManager) {
      return res.status(400).json({ error: 'Player is already manager of another team' });
    }

    const uniqueMemberIds = Array.from(new Set([managerId, ...memberIds]));
    const memberCount = await db.player.count({
      where: { id: { in: uniqueMemberIds }, gameId },
    });
    if (memberCount !== uniqueMemberIds.length) {
      return res.status(400).json({ error: 'One or more members are not in this game' });
    }

    const team = await db.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          gameId,
          name,
          manager: { connect: { id: managerId } },
          members: { connect: uniqueMemberIds.map((id: string) => ({ id })) },
        },
      });
      return created;
    });

    res.status(201).json(team);
  } catch (err) {
    console.error('create team failed', err);
    res.status(500).json({ error: 'Could not create team' });
  }
});

router.patch('/:teamId', async (req, res) => {
  const { gameId, teamId } = req.params;
  const { name, managerId, memberIds } = req.body ?? {};

  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const team = await db.team.findFirst({
      where: { id: teamId, gameId },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (managerId !== undefined) {
      const manager = await db.player.findFirst({
        where: { id: managerId, gameId, type: 'APP' },
      });
      if (!manager) {
        return res.status(400).json({ error: 'Manager must be an App player in this game' });
      }
      const existingManager = await db.team.findFirst({
        where: { managerId, gameId, id: { not: teamId } },
      });
      if (existingManager) {
        return res.status(400).json({ error: 'Player is already manager of another team' });
      }
      updateData.manager = { connect: { id: managerId } };
    }

    if (memberIds !== undefined) {
      const managerToKeep = managerId ?? team.managerId;
      const uniqueMemberIds = Array.from(new Set([...(managerToKeep ? [managerToKeep] : []), ...memberIds]));
      const memberCount = await db.player.count({
        where: { id: { in: uniqueMemberIds }, gameId },
      });
      if (memberCount !== uniqueMemberIds.length) {
        return res.status(400).json({ error: 'One or more members are not in this game' });
      }
      updateData.members = { set: uniqueMemberIds.map((id: string) => ({ id })) };
    }

    const updated = await db.team.update({
      where: { id: teamId },
      data: updateData,
      include: { manager: true, members: true },
    });

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'team' });

    res.json(updated);
  } catch (err) {
    console.error('update team failed', err);
    res.status(500).json({ error: 'Could not update team' });
  }
});

export default router;
