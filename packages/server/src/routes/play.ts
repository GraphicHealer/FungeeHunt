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
    const tasksWithStatus = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      points: task.points,
      proofType: task.proofType,
      photoCount: task.photoCount,
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

    res.json({
      player,
      team: team ? { ...team, score: completedScore + returnBonus + foodDriveBonus } : null,
      game: {
        id: game.id,
        name: game.name,
        status: game.status,
        foodDriveEnabled: game.foodDriveEnabled,
        foodDrivePointsPerItem: game.foodDrivePointsPerItem,
        foodDrivePermissible: game.foodDrivePermissible,
        foodDriveSuggested: game.foodDriveSuggested,
      },
      tasks: tasksWithStatus,
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
      return res.status(403).json({ error: 'Only the manager can rename the team' });
    }
    const team = await db.team.update({
      where: { id: player.teamId },
      data: { name },
    });
    res.json(team);
  } catch (err) {
    console.error('rename team failed', err);
    res.status(500).json({ error: 'Could not rename team' });
  }
});

export default router;
