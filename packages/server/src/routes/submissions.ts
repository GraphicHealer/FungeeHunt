import { Router } from 'express';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { db } from '../db/client';
import { config } from '../config';

const router = Router({ mergeParams: true });

router.get('/', async (req: any, res: any) => {
  const { gameId } = req.params;
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const teams = await db.team.findMany({ where: { gameId } });
    const tasks = await db.task.findMany({ where: { gameId } });
    const teamMap = new Map(teams.map((t: any) => [t.id, t]));
    const taskMap = new Map(tasks.map((t: any) => [t.id, t]));

    const submissions = await db.submission.findMany({
      where: { teamId: { in: teams.map((t: any) => t.id) } },
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

router.patch('/:submissionId', async (req: any, res: any) => {
  const { gameId, submissionId } = req.params;
  const { status, reason, isHighlight } = req.body ?? {};

  const hasStatus = status !== undefined;
  const hasHighlight = isHighlight !== undefined;
  if (!hasStatus && !hasHighlight) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  if (hasStatus && !['COMPLETED', 'INCOMPLETE', 'UNDER_REVIEW'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (hasStatus && status === 'INCOMPLETE' && !reason?.trim()) {
    return res.status(400).json({ error: 'A reason is required when marking a submission incomplete' });
  }

  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const current = await db.submission.findUnique({ where: { id: submissionId } });
    if (!current) return res.status(404).json({ error: 'Submission not found' });

    const updateData: any = {};
    if (hasStatus) {
      updateData.status = status;
      if (status === 'INCOMPLETE') {
        updateData.reason = reason ? reason.trim() : null;
        updateData.proofUrl = '';
        updateData.proofUrls = [];
        updateData.reviewedAt = null;
        updateData.isHighlight = false;
        for (const url of new Set([current.proofUrl, ...(current.proofUrls ?? [])])) {
          if (!url) continue;
          const filename = url.replace('/uploads/', '');
          try {
            unlinkSync(join(config.UPLOAD_DIR, filename));
          } catch (e) {
            console.warn('could not delete denied file', url, e);
          }
        }
      } else if (status === 'COMPLETED') {
        updateData.reviewedAt = new Date();
      } else if (status === 'UNDER_REVIEW') {
        updateData.reviewedAt = null;
      }
    }

    if (hasHighlight) {
      if (isHighlight) {
        const count = await db.submission.count({
          where: { team: { gameId }, isHighlight: true },
        });
        if (!current.isHighlight && count >= 5) {
          return res.status(400).json({ error: 'You can only flag up to 5 submissions as Best of' });
        }
        updateData.isHighlight = true;
      } else {
        updateData.isHighlight = false;
      }
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
