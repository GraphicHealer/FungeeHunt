import { Router } from 'express';
import { db } from '../db/client';
import { generateGameCode } from '../lib/gameCode';
import { getSystemSettings } from '../lib/defaults';
import { getBaseUrl } from '../lib/urls';

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectTasks(defaultTasks: any[], count: number) {
  if (!defaultTasks.length) return [];
  count = Math.max(1, Math.min(count, defaultTasks.length));

  const normalized = defaultTasks.map((t: any) => ({ ...t, category: t.category ?? 'General' }));
  const teamPhotoTasks = normalized.filter((t: any) => t.category.toLowerCase() === 'team photo');
  const nonTeamTasks = normalized.filter((t: any) => t.category.toLowerCase() !== 'team photo');

  const selected = [];
  if (teamPhotoTasks.length) {
    const pick = teamPhotoTasks[Math.floor(Math.random() * teamPhotoTasks.length)];
    selected.push({ ...pick, order: 1 });
  } else {
    selected.push({
      title: 'Team Photo',
      description: 'Take a photo of the whole team together.',
      points: 50,
      proofType: 'PHOTO',
      category: 'Team Photo',
      order: 1,
    });
  }

  const remaining = Math.max(0, count - 1);
  const groups: Record<string, any[]> = {};
  for (const t of shuffle(nonTeamTasks)) {
    const c = t.category || 'General';
    (groups[c] ||= []).push(t);
  }

  const others = [];
  const categories = Object.keys(groups);
  let round = 0;
  while (others.length < remaining) {
    let added = false;
    for (const cat of categories) {
      if (groups[cat].length === 0) continue;
      const pick = groups[cat].shift();
      others.push(pick);
      added = true;
      if (others.length >= remaining) break;
    }
    if (!added) break;
  }

  // If we exhausted the round-robin, fall back to any remaining shuffled tasks.
  for (const cat of categories) {
    while (others.length < remaining && groups[cat].length > 0) {
      const pick = groups[cat].shift();
      others.push(pick);
    }
  }

  const shuffledOthers = shuffle(others);
  selected.push(...shuffledOthers.map((t: any, i: number) => ({ ...t, order: i + 2 })));
  return selected;
}

function withJoinUrl(baseUrl: string, game: any) {
  return {
    ...game,
    joinUrl: `${baseUrl}/play/${game.code}`,
    viewUrl: `${baseUrl}/view/${game.code}`,
  };
}

function fmtTime(iso?: string | Date) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDate(iso?: string | Date) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US');
}

async function syncAutoRuleSections(game: any) {
  try {
    if (game.returnBonusEnabled) {
      const body = `Teams that return to the finish between ${fmtTime(game.returnStart)} and ${fmtTime(game.returnEnd)} will receive an additional ${game.returnPoints} points.\n\nThe Game Master must confirm your team's return to receive the bonus.`;
      await syncSection(game.id, 'RETURN TIME BONUS', body);
    } else {
      await removeSection(game.id, 'RETURN TIME BONUS');
    }

    if (game.foodDriveEnabled) {
      const body = `Each eligible food drive item turned in is worth ${game.foodDrivePointsPerItem} points.\n\nPermissible items: ${game.foodDrivePermissible || 'as announced by the Game Master'}.\nSuggested items: ${game.foodDriveSuggested || 'none specified'}.`;
      await syncSection(game.id, 'FOOD DRIVE BONUS', body);
    } else {
      await removeSection(game.id, 'FOOD DRIVE BONUS');
    }
  } catch (err) {
    console.error('sync rules failed', err);
  }
}

async function findSection(gameId: string, title: string) {
  return db.ruleSection.findFirst({
    where: { gameId, title: { equals: title, mode: 'insensitive' } },
  });
}

async function syncSection(gameId: string, title: string, body: string) {
  const existing = await findSection(gameId, title);
  if (existing) {
    await db.ruleSection.update({ where: { id: existing.id }, data: { body } });
  } else {
    await db.ruleSection.create({ data: { gameId, title, body } });
  }
}

async function removeSection(gameId: string, title: string) {
  const existing = await findSection(gameId, title);
  if (existing) await db.ruleSection.delete({ where: { id: existing.id } });
}

router.post('/', async (req, res) => {
  try {
    const settings = await getSystemSettings();
    const defaults = {
      returnBonusEnabled: settings.returnBonusEnabled,
      returnBonusPoints: settings.returnBonusPoints,
      foodDriveEnabled: settings.foodDriveEnabled,
      foodDrivePointsPerItem: settings.foodDrivePointsPerItem,
      foodDrivePermissible: settings.foodDrivePermissible,
      foodDriveSuggested: settings.foodDriveSuggested,
    };
    const body = { ...defaults, ...(req.body ?? {}) };

    const code = await generateGameCode();
    const game = await db.game.create({
      data: {
        code,
        ...buildGameData(body),
      },
    });

    const defaultTasks = settings.defaultTasks ? JSON.parse(settings.defaultTasks) : [];
    const defaultRules = settings.defaultRules ? JSON.parse(settings.defaultRules) : [];

    const taskCount = Math.min(asInt(body.taskCount) || 20, defaultTasks.length || 20);

    const selectedTasks = selectTasks(defaultTasks, taskCount);
    if (selectedTasks.length) {
      await db.task.createMany({
        data: selectedTasks.map((t: any, i: number) => ({
          gameId: game.id,
          title: t.title ?? 'Task',
          description: t.description ?? '',
          points: Number(t.points) || 0,
          proofType: ['PHOTO', 'VIDEO', 'EITHER'].includes(t.proofType) ? t.proofType : 'PHOTO',
          category: t.category ?? 'General',
          order: t.order ?? i + 1,
        })),
      });
    }

    if (defaultRules.length) {
      await db.ruleSection.createMany({
        data: defaultRules.map((r: any) => ({
          gameId: game.id,
          title: r.title ?? '',
          body: r.body ?? '',
        })),
      });
    }

    await syncAutoRuleSections(game);

    res.json(withJoinUrl(getBaseUrl(req), game));
  } catch (err) {
    console.error('create game failed', err);
    res.status(500).json({ error: 'Could not create game' });
  }
});

router.get('/', async (req, res) => {
  try {
    const games = await db.game.findMany({ orderBy: { startAt: 'asc' } });
    res.json(games.map((game) => withJoinUrl(getBaseUrl(req), game)));
  } catch (err) {
    console.error('list games failed', err);
    res.status(500).json({ error: 'Could not list games' });
  }
});

router.get('/:gameId', async (req, res) => {
  try {
    const game = await db.game.findUnique({ where: { id: req.params.gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(withJoinUrl(getBaseUrl(req), game));
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

      const unassigned = await db.player.count({
        where: { gameId, teamId: null },
      });
      if (unassigned > 0) {
        return res.status(400).json({
          error: `All players must be assigned to a team before starting. ${unassigned} player(s) are not assigned.`,
        });
      }
    }

    const game = await db.game.update({
      where: { id: gameId },
      data: updates,
    });

    await syncAutoRuleSections(game);

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'game' });

    res.json(withJoinUrl(getBaseUrl(req), game));
  } catch (err) {
    console.error('update game failed', err);
    res.status(500).json({ error: 'Could not update game' });
  }
});

export default router;
