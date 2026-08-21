import { Router } from 'express';
import { db } from '../db/client';
import { config } from '../config';
import { generateGameCode } from '../lib/gameCode';

const router = Router();

function asDate(value: any): Date | null {
  return value ? new Date(value) : null;
}

function asBool(value: any): boolean {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function asInt(value: any): number {
  return Number(value) || 0;
}

function validStatus(value: any): string | undefined {
  return ['NOT_STARTED', 'LIVE', 'COMPLETED'].includes(value) ? value : undefined;
}

function buildGameData(body: any, partial = false) {
  const data: any = {};

  if (body.name !== undefined || !partial) {
    data.name = body.name ?? 'Untitled Game';
  }
  if (body.startAt !== undefined || !partial) {
    data.startAt = asDate(body.startAt);
  }
  if (body.endAt !== undefined || !partial) {
    data.endAt = asDate(body.endAt);
  }
  if (body.submissionMode !== undefined || !partial) {
    data.submissionMode = body.submissionMode === 'MANUAL' ? 'MANUAL' : 'AUTOMATIC';
  }
  if (body.viewerEnabled !== undefined || !partial) {
    data.viewerEnabled = asBool(body.viewerEnabled);
  }
  if (body.status !== undefined) {
    const status = validStatus(body.status);
    if (status) data.status = status;
  }
  if (body.returnBonusEnabled !== undefined || !partial) {
    data.returnBonusEnabled = asBool(body.returnBonusEnabled);
  }
  if (body.returnStart !== undefined || !partial) {
    data.returnStart = asDate(body.returnStart);
  }
  if (body.returnEnd !== undefined || !partial) {
    data.returnEnd = asDate(body.returnEnd);
  }
  if (body.returnPoints !== undefined || !partial) {
    data.returnPoints = asInt(body.returnPoints);
  }
  if (body.foodDriveEnabled !== undefined || !partial) {
    data.foodDriveEnabled = asBool(body.foodDriveEnabled);
  }
  if (body.foodDrivePointsPerItem !== undefined || !partial) {
    data.foodDrivePointsPerItem = asInt(body.foodDrivePointsPerItem);
  }
  if (body.foodDrivePermissible !== undefined || !partial) {
    data.foodDrivePermissible = body.foodDrivePermissible ?? '';
  }
  if (body.foodDriveSuggested !== undefined || !partial) {
    data.foodDriveSuggested = body.foodDriveSuggested ?? '';
  }

  return data;
}

function withJoinUrl(game: any) {
  return {
    ...game,
    joinUrl: `${config.PUBLIC_URL}/play/${game.code}`,
    viewUrl: `${config.PUBLIC_URL}/view/${game.code}`,
  };
}

router.post('/', async (req, res) => {
  try {
    const code = await generateGameCode();
    const game = await db.game.create({
      data: {
        code,
        ...buildGameData(req.body ?? {}),
      },
    });
    res.json(withJoinUrl(game));
  } catch (err) {
    console.error('create game failed', err);
    res.status(500).json({ error: 'Could not create game' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const games = await db.game.findMany({ orderBy: { startAt: 'asc' } });
    res.json(games.map(withJoinUrl));
  } catch (err) {
    console.error('list games failed', err);
    res.status(500).json({ error: 'Could not list games' });
  }
});

router.get('/:gameId', async (req, res) => {
  try {
    const game = await db.game.findUnique({ where: { id: req.params.gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(withJoinUrl(game));
  } catch (err) {
    console.error('get game failed', err);
    res.status(500).json({ error: 'Could not load game' });
  }
});

router.delete('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    await db.$transaction(async (tx) => {
      await tx.submission.deleteMany({ where: { task: { gameId } } });
      await tx.task.deleteMany({ where: { gameId } });
      await tx.ruleSection.deleteMany({ where: { gameId } });
      await tx.team.deleteMany({ where: { gameId } });
      await tx.player.deleteMany({ where: { gameId } });
      await tx.game.delete({ where: { id: gameId } });
    });

    res.status(204).end();
  } catch (err) {
    console.error('delete game failed', err);
    res.status(500).json({ error: 'Could not delete game' });
  }
});

router.patch('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const updates = buildGameData(req.body ?? {}, true);

    if (updates.status === 'LIVE') {
      const teams = await db.team.findMany({
        where: { gameId },
        include: { manager: true },
      });

      if (teams.length === 0) {
        return res.status(400).json({
          error: 'Create at least one team before starting the game.',
        });
      }

      for (const team of teams) {
        if (!team.manager) {
          return res.status(400).json({
            error: `Team "${team.name ?? 'Unnamed'}" is missing a manager.`,
          });
        }
        if (team.manager.type !== 'APP') {
          return res.status(400).json({
            error: `Manager for team "${team.name ?? 'Unnamed'}" must be an online player.`,
          });
        }
      }
    }

    const game = await db.game.update({
      where: { id: gameId },
      data: updates,
    });

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'game' });

    res.json(withJoinUrl(game));
  } catch (err) {
    console.error('update game failed', err);
    res.status(500).json({ error: 'Could not update game' });
  }
});

export default router;
