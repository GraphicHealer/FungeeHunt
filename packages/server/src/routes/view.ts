import { Router } from 'express';
import * as QRCode from 'qrcode';
import { db } from '../db/client';
import { getBaseUrl } from '../lib/urls';
import { toSafeTeam } from '../lib/safePlayer';

const router = Router({ mergeParams: true });

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

router.get('/', async (req, res) => {
  const { code } = req.params;
  try {
    const game = await db.game.findUnique({ where: { code: code.toUpperCase() } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const rawTeams = await db.team.findMany({
      where: { gameId: game.id },
      include: { manager: true },
    });
    const teams = rawTeams.map(toSafeTeam);

    const tasks = await db.task.findMany({
      where: { gameId: game.id },
      orderBy: { order: 'asc' },
    });

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    const completedSubmissions = await db.submission.findMany({
      where: {
        teamId: { in: teams.map((t) => t.id) },
        status: 'COMPLETED',
      },
      orderBy: { submittedAt: 'desc' },
    });

    const photoSubmissions = completedSubmissions.filter((s) => {
      const task = taskMap.get(s.taskId);
      return task && task.proofType !== 'VIDEO';
    });

    const scoreMap = new Map<string, number>();
    for (const sub of completedSubmissions) {
      const task = taskMap.get(sub.taskId);
      if (!task) continue;
      scoreMap.set(sub.teamId, (scoreMap.get(sub.teamId) ?? 0) + task.points);
    }

    const leaderboard = teams
      .map((team) => {
        const completedScore = scoreMap.get(team.id) ?? 0;
        const returnBonus = team.returnBonusAwarded ? game.returnPoints : 0;
        const foodDriveBonus = team.foodDriveBonusAwarded
          ? team.foodDriveItems * game.foodDrivePointsPerItem
          : 0;
        return {
          ...team,
          score: completedScore + returnBonus + foodDriveBonus,
          completed: completedSubmissions.filter((s) => s.teamId === team.id).length,
        };
      })
      .sort((a, b) => b.score - a.score);

    const recent = photoSubmissions.slice(0, 20).map((sub) => ({
      ...sub,
      team: teamMap.get(sub.teamId),
      task: taskMap.get(sub.taskId),
    }));

    const joinUrl = `${getBaseUrl(req)}/play/${game.code}`;
    const qrUrl = await QRCode.toDataURL(joinUrl, { width: 512, margin: 2 });
    const archiveUrl = `${getBaseUrl(req)}/play/${game.code}`;
    const archiveQrUrl = await QRCode.toDataURL(archiveUrl, { width: 512, margin: 2 });

    let remainingMs: number | null = null;
    if (game.status === 'LIVE' && game.endAt) {
      remainingMs = Math.max(0, new Date(game.endAt).getTime() - Date.now());
    }

    res.json({
      game: {
        id: game.id,
        name: game.name,
        code: game.code,
        status: game.status,
        startAt: game.startAt,
        endAt: game.endAt,
        foodDriveEnabled: game.foodDriveEnabled,
        foodDrivePointsPerItem: game.foodDrivePointsPerItem,
        joinUrl,
        qrUrl,
        archiveUrl,
        archiveQrUrl,
        recapVideoStatus: game.recapVideoStatus,
        recapVideoUrl: game.recapVideoUrl,
      },
      leaderboard,
      recent,
      remaining: remainingMs ? formatDuration(remainingMs) : null,
    });
  } catch (err) {
    console.error('viewer state failed', err);
    res.status(500).json({ error: 'Could not load viewer' });
  }
});

export default router;
