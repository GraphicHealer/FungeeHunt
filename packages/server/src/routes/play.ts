import { Router } from 'express';
import { db } from '../db/client';
import { playerAuth } from '../middleware/playerAuth';

const router = Router({ mergeParams: true });

router.use(playerAuth);

router.get('/', async (req, res) => {
  const player = (res.locals as any).player;
  const game = (res.locals as any).game;

  try {
    const tasks = await db.task.findMany({
      where: { gameId: game.id },
      orderBy: { order: 'asc' },
    });

    const submissions = player.teamId
      ? await db.submission.findMany({
          where: { teamId: player.teamId },
          orderBy: { submittedAt: 'desc' },
        })
      : [];

    const byTask = new Map(submissions.map((s: any) => [s.taskId, s]));
    const now = Date.now();
    const bonusTask = tasks.find((task: any) => task.isBonus);
    const bonusSubmission = bonusTask ? (byTask.get(bonusTask.id) ?? null) : null;
    const bonusActive = bonusTask && game.bonusStart && game.bonusEnd &&
      now >= new Date(game.bonusStart).getTime() &&
      now <= new Date(game.bonusEnd).getTime();
    const bonusCompleted = bonusSubmission?.status === 'COMPLETED';

    const bonusWithStatus = bonusTask && (bonusActive || bonusCompleted)
      ? {
          id: bonusTask.id,
          title: bonusTask.title,
          description: bonusTask.description,
          points: bonusTask.points,
          proofType: bonusTask.proofType,
          photoCount: bonusTask.photoCount,
          delayMinutes: null,
          isBonus: true,
          order: 0,
          submission: bonusSubmission,
        }
      : null;

    const tasksWithStatus = tasks
      .filter((task: any) => !task.isBonus)
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        points: task.points,
        proofType: task.proofType,
        photoCount: task.photoCount,
        delayMinutes: task.delayMinutes,
        isBonus: false,
        order: task.order,
        submission: byTask.get(task.id) ?? null,
      }));

    const team = player.team;
    const completedScore = submissions
      .filter((s: any) => s.status === 'COMPLETED')
      .reduce((sum: number, s: any) => {
        const task = tasks.find((t: any) => t.id === s.taskId);
        return sum + (task?.points ?? 0);
      }, 0);
    const returnBonus = team?.returnBonusAwarded ? game.returnPoints : 0;
    const foodDriveBonus = team?.foodDriveBonusAwarded
      ? (team.foodDriveItems ?? 0) * game.foodDrivePointsPerItem
      : 0;

    let announcement = null;
    if (game.lastAnnouncement && game.lastAnnouncementAt) {
      const readAt = player.lastAnnouncementReadAt ? new Date(player.lastAnnouncementReadAt).getTime() : 0;
      const sentAt = new Date(game.lastAnnouncementAt).getTime();
      const a = game.lastAnnouncement as any;
      const matchAll = !a.teamIds || a.teamIds === 'all' || (Array.isArray(a.teamIds) && a.teamIds.length === 0);
      const matchTeam = team && Array.isArray(a.teamIds) && a.teamIds.includes(team.id);
      const matchCaptain = !a.captainsOnly || player.id === team?.managerId;
      if (sentAt > readAt && matchCaptain && (matchAll || matchTeam)) {
        announcement = { message: a.message, sentAt: game.lastAnnouncementAt };
      }
    }

    res.json({
      player,
      team: team ? { ...team, foodDriveItems: team.foodDriveItems ?? 0, score: completedScore + returnBonus + foodDriveBonus } : null,
      game: {
        id: game.id,
        name: game.name,
        status: game.status,
        startAt: game.startAt,
        liveAt: game.liveAt,
        endAt: game.endAt,
        bonusStart: game.bonusStart,
        bonusEnd: game.bonusEnd,
        foodDriveEnabled: game.foodDriveEnabled,
        foodDrivePointsPerItem: game.foodDrivePointsPerItem,
        foodDrivePermissible: game.foodDrivePermissible,
        foodDriveSuggested: game.foodDriveSuggested,
        captainCanUpdateFoodDrive: game.captainCanUpdateFoodDrive,
      },
      bonusTask: bonusWithStatus,
      tasks: tasksWithStatus,
      announcement,
    });
  } catch (err) {
    console.error('play state failed', err);
    res.status(500).json({ error: 'Could not load game state' });
  }
});

router.get('/rules', async (req, res) => {
  const game = (res.locals as any).game;
  try {
    const sections = await db.ruleSection.findMany({
      where: { gameId: game.id },
      orderBy: { id: 'asc' },
    });
    res.json(sections);
  } catch (err) {
    console.error('load rules failed', err);
    res.status(500).json({ error: 'Could not load rules' });
  }
});

router.patch('/team', async (req, res) => {
  const player = (res.locals as any).player;
  const { name } = req.body ?? {};

  try {
    if (!player.teamId) {
      return res.status(400).json({ error: 'Not assigned to a team' });
    }
    if (player.team?.managerId !== player.id) {
      return res.status(403).json({ error: 'Only the Team Captain can rename the team' });
    }
    const team = await db.team.update({
      where: { id: player.teamId },
      data: { name },
    });
    const game = (res.locals as any).game;
    if (game?.code) {
      const io = (req as any).app.get('io') as any;
      io?.emit(`game:${game.code.toUpperCase()}`, { type: 'team-update' });
    }
    res.json(team);
  } catch (err) {
    console.error('rename team failed', err);
    res.status(500).json({ error: 'Could not rename team' });
  }
});

router.patch('/food-drive', async (req, res) => {
  const player = (res.locals as any).player;
  const game = (res.locals as any).game;
  const { items } = req.body ?? {};

  try {
    if (!player.teamId) {
      return res.status(400).json({ error: 'Not assigned to a team' });
    }
    if (player.team?.managerId !== player.id) {
      return res.status(403).json({ error: 'Only the Team Captain can update the food drive count' });
    }
    if (!game.foodDriveEnabled || !game.captainCanUpdateFoodDrive) {
      return res.status(403).json({ error: 'Food drive updates are disabled' });
    }
    const team = await db.team.update({
      where: { id: player.teamId },
      data: { foodDriveItems: Math.max(0, Number(items) || 0) },
    });
    if (game?.code) {
      const io = (req as any).app.get('io') as any;
      io?.emit(`game:${game.code.toUpperCase()}`, { type: 'team-update' });
    }
    res.json(team);
  } catch (err) {
    console.error('update food drive failed', err);
    res.status(500).json({ error: 'Could not update food drive count' });
  }
});

router.post('/push-subscribe', async (req, res) => {
  const player = (res.locals as any).player;
  const { endpoint, keys } = req.body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  try {
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: { playerId: player.id, p256dh: keys.p256dh, auth: keys.auth },
      create: { playerId: player.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.status(204).end();
  } catch (err) {
    console.error('push subscribe failed', err);
    res.status(500).json({ error: 'Could not save push subscription' });
  }
});

router.post('/announce-read', async (req, res) => {
  const player = (res.locals as any).player;
  try {
    await db.player.update({
      where: { id: player.id },
      data: { lastAnnouncementReadAt: new Date() },
    });
    res.status(204).end();
  } catch (err) {
    console.error('mark announcement read failed', err);
    res.status(500).json({ error: 'Could not mark read' });
  }
});

router.get('/chat', async (req, res) => {
  const player = (res.locals as any).player;
  const game = (res.locals as any).game;
  const team = player.team;
  if (!team) return res.status(400).json({ error: 'Not on a team' });
  try {
    const messages = await db.message.findMany({
      where: { gameId: game.id, teamId: team.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (err) {
    console.error('load chat failed', err);
    res.status(500).json({ error: 'Could not load chat' });
  }
});

router.post('/chat', async (req, res) => {
  const player = (res.locals as any).player;
  const game = (res.locals as any).game;
  const team = player.team;
  const { content } = req.body ?? {};
  if (!team) return res.status(400).json({ error: 'Not on a team' });
  if (!content?.trim()) return res.status(400).json({ error: 'Message is empty' });
  try {
    const msg = await db.message.create({
      data: {
        gameId: game.id,
        teamId: team.id,
        sender: 'CAPTAIN',
        content: content.trim(),
      },
    });
    const io = (req as any).app.get('io') as any;
    io?.emit(`game:${game.code.toUpperCase()}:chat:${team.id}`, { type: 'message', message: msg });
    io?.emit(`gm:${game.id}:chat`, { type: 'message', teamId: team.id, message: msg });
    io?.emit(`game:${game.code.toUpperCase()}`, { type: 'chat' });
    res.status(201).json(msg);
  } catch (err) {
    console.error('send chat failed', err);
    res.status(500).json({ error: 'Could not send message' });
  }
});

router.post('/chat/read', async (req, res) => {
  const player = (res.locals as any).player;
  const game = (res.locals as any).game;
  const team = player.team;
  if (!team) return res.status(400).json({ error: 'Not on a team' });
  try {
    await db.message.updateMany({
      where: { gameId: game.id, teamId: team.id, sender: 'GM', readAt: null },
      data: { readAt: new Date() },
    });
    const io = (req as any).app.get('io') as any;
    io?.emit(`game:${game.code.toUpperCase()}:chat:${team.id}`, { type: 'read' });
    io?.emit(`gm:${game.id}:chat`, { type: 'read', teamId: team.id });
    io?.emit(`game:${game.code.toUpperCase()}`, { type: 'chat' });
    res.status(204).end();
  } catch (err) {
    console.error('mark chat read failed', err);
    res.status(500).json({ error: 'Could not mark read' });
  }
});

export default router;
