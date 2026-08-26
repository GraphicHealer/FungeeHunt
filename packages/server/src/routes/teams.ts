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
      return res.status(400).json({ error: 'Team Captain must be an App player in this game' });
    }

    const existingManager = await db.team.findFirst({
      where: { managerId, gameId },
    });
    if (existingManager) {
      return res.status(400).json({ error: 'Player is already Team Captain of another team' });
    }

    let trimmedName = name ? name.trim() : '';
    if (trimmedName) {
      const existing = await db.team.findFirst({
        where: { gameId, name: { equals: trimmedName, mode: 'insensitive' } },
      });
      if (existing) {
        return res.status(400).json({ error: 'A team with that name already exists' });
      }
    } else {
      const count = await db.team.count({ where: { gameId } });
      trimmedName = `Team ${count + 1}`;
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
          game: { connect: { id: gameId } },
          name: trimmedName || null,
          manager: { connect: { id: managerId } },
          members: { connect: uniqueMemberIds.map((id: string) => ({ id })) },
        },
      });
      return created;
    });

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'team' });

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
      const trimmed = name ? name.trim() : '';
      if (trimmed) {
        const existing = await db.team.findFirst({
          where: {
            gameId,
            id: { not: teamId },
            name: { equals: trimmed, mode: 'insensitive' },
          },
        });
        if (existing) {
          return res.status(400).json({ error: 'A team with that name already exists' });
        }
      }
      updateData.name = trimmed || null;
    }

    if (managerId !== undefined) {
      const manager = await db.player.findFirst({
        where: { id: managerId, gameId, type: 'APP' },
      });
      if (!manager) {
        return res.status(400).json({ error: 'Team Captain must be an App player in this game' });
      }
      const existingManager = await db.team.findFirst({
        where: { managerId, gameId, id: { not: teamId } },
      });
      if (existingManager) {
        return res.status(400).json({ error: 'Player is already Team Captain of another team' });
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

router.post('/auto', async (req, res) => {
  const { gameId } = req.params;
  const { teamCount } = req.body ?? {};
  const count = Number(teamCount);
  if (!count || count < 1 || !Number.isInteger(count)) {
    return res.status(400).json({ error: 'A positive number of teams is required' });
  }

  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const players = await db.player.findMany({
      where: { gameId, teamId: null },
    });

    if (players.length < count) {
      return res.status(400).json({ error: 'Not enough unassigned players for that many teams' });
    }

    const apps = players.filter((p: any) => p.type === 'APP');
    const drivers = players.filter((p: any) => p.hasCar);

    if (apps.length < count) {
      return res.status(400).json({ error: 'Not enough app players to be Team Captains for every team' });
    }
    if (drivers.length < count) {
      return res.status(400).json({ error: 'Not enough drivers for every team to have one' });
    }

    // Seed with one app player as manager per team, preferring drivers.
    const sortedApps = [...apps].sort((a: any, b: any) => Number(b.hasCar) - Number(a.hasCar));
    const teamSeeds = sortedApps.slice(0, count);
    const remainingPlayers = players.filter((p: any) => !teamSeeds.some((s: any) => s.id === p.id));

    // Each team needs at least one driver; if the manager is not a driver, add one.
    const teamsToCreate: { managerId: string; memberIds: string[] }[] = teamSeeds.map((manager: any) => {
      const memberIds = [manager.id];
      if (!manager.hasCar) {
        const driverIndex = remainingPlayers.findIndex((p: any) => p.hasCar);
        if (driverIndex !== -1) {
          const driver = remainingPlayers.splice(driverIndex, 1)[0];
          memberIds.push(driver.id);
        }
      }
      return { managerId: manager.id, memberIds };
    });

    // Assign remaining players round-robin to balance team sizes.
    let teamIndex = 0;
    for (const player of shuffle(remainingPlayers)) {
      teamsToCreate[teamIndex].memberIds.push(player.id);
      teamIndex = (teamIndex + 1) % count;
    }

    await db.$transaction(async (tx) => {
      const existingCount = await tx.team.count({ where: { gameId } });
      for (let i = 0; i < teamsToCreate.length; i++) {
        const seed = teamsToCreate[i];
        const name = `Team ${existingCount + i + 1}`;
        await tx.team.create({
          data: {
            game: { connect: { id: gameId } },
            name,
            manager: { connect: { id: seed.managerId } },
            members: { connect: seed.memberIds.map((id: string) => ({ id })) },
          },
        });
      }
    });

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'team' });

    res.status(201).json({ count: teamsToCreate.length });
  } catch (err) {
    console.error('auto create teams failed', err);
    res.status(500).json({ error: 'Could not auto-create teams' });
  }
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default router;
