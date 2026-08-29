import { Router } from 'express';
import { db } from '../db/client';

const router = Router({ mergeParams: true });

router.get('/', async (req: any, res: any) => {
  const { code } = req.params;
  try {
    const game = await db.game.findUnique({
      where: { code: (code ?? '').toUpperCase() },
      select: { id: true, name: true, code: true, status: true },
    });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (game.status !== 'COMPLETED') {
      return res.json({ game: { name: game.name, code: game.code, status: game.status }, teams: [] });
    }

    const teams = await db.team.findMany({
      where: { gameId: game.id },
      orderBy: { name: 'asc' },
      include: {
        submissions: {
          include: { task: { select: { id: true, title: true, points: true, proofType: true, order: true } } },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    res.json({
      game: { name: game.name, code: game.code, status: game.status },
      teams: teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        submissions: t.submissions.map((s: any) => ({
          id: s.id,
          status: s.status,
          proofUrl: s.proofUrl,
          proofUrls: s.proofUrls,
          taskTitle: s.task?.title ?? 'Unknown task',
          taskPoints: s.task?.points ?? 0,
          proofType: s.task?.proofType ?? 'PHOTO',
          taskOrder: s.task?.order ?? 0,
          taskId: s.task?.id ?? '',
        })),
      })),
    });
  } catch (err) {
    console.error('archive failed', err);
    res.status(500).json({ error: 'Could not load archive' });
  }
});

export default router;
