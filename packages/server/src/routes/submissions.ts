import { Router } from 'express';
import { db } from '../db/client';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { gameId } = req.params;
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const teams = await db.team.findMany({ where: { gameId } });
    const tasks = await db.task.findMany({ where: { gameId } });
    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    const submissions = await db.submission.findMany({
      where: { teamId: { in: teams.map((t) => t.id) } },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(
      submissions.map((s) => ({
        ...s,
        team: teamMap.get(s.teamId),
        task: taskMap.get(s.taskId),
      })),
    );
  } catch (err) {
    console.error('list submissions failed', err);
    res.status(500).json({ error: 'Could not list submissions' });
  }
});

router.patch('/:submissionId', async (req, res) => {
  const { gameId, submissionId } = req.params;
  const { status, reason } = req.body ?? {};

  if (!['COMPLETED', 'INCOMPLETE', 'UNDER_REVIEW'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const updateData: any = { status };
    if (status === 'INCOMPLETE') {
      updateData.reason = reason ?? '';
    } else if (status === 'COMPLETED') {
      updateData.reviewedAt = new Date();
    } else if (status === 'UNDER_REVIEW') {
      updateData.reviewedAt = null;
    }

    const submission = await db.submission.update({
      where: { id: submissionId },
      data: updateData,
    });

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'submission' });

    res.json(submission);
  } catch (err) {
    console.error('review submission failed', err);
    res.status(500).json({ error: 'Could not review submission' });
  }
});

export default router;
