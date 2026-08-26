import { Router } from 'express';
import { db } from '../db/client';
import { playerAuth } from '../middleware/playerAuth';
import { upload } from '../lib/uploads';

const router = Router({ mergeParams: true });

router.post('/', playerAuth, upload.array('proof', 10), async (req: any, res: any) => {
  const { taskId } = req.params;
  const player = (res.locals as any).player;
  const game = (res.locals as any).game;
  const files = (req.files ?? []) as any[];

  if (files.length === 0) {
    return res.status(400).json({ error: 'Photo or video proof is required' });
  }

  if (!player.teamId || !player.team || player.team.managerId !== player.id) {
    return res.status(403).json({ error: 'Only the Team Captain can submit proof' });
  }

  try {
    const task = await db.task.findFirst({
      where: { id: taskId, gameId: game.id },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const urls = files.map((f) => `/uploads/${f.filename}`);
    const isPhoto = (f: any) => f.mimetype.startsWith('image/');
    const isVideo = (f: any) => f.mimetype.startsWith('video/');

    const allPhotos = files.every(isPhoto);
    const allVideos = files.every(isVideo);

    if (task.proofType === 'PHOTO' && (files.length !== 1 || !allPhotos)) {
      return res.status(400).json({ error: 'This task requires a single photo' });
    }
    if (task.proofType === 'VIDEO' && (files.length !== 1 || !allVideos)) {
      return res.status(400).json({ error: 'This task requires a single video' });
    }
    if (task.proofType === 'PHOTOS' && !allPhotos) {
      return res.status(400).json({ error: 'This task requires one or more photos' });
    }

    const existing = await db.submission.findUnique({
      where: { taskId_teamId: { taskId, teamId: player.teamId } },
    });

    if (existing && ['SUBMITTED', 'UNDER_REVIEW', 'COMPLETED'].includes(existing.status)) {
      return res.status(409).json({ error: 'A submission for this task is already in progress or approved' });
    }

    const proofUrl = urls[0];
    const status = game.submissionMode === 'AUTOMATIC' ? 'COMPLETED' : 'SUBMITTED';

    let submission;
    if (existing && existing.status === 'INCOMPLETE') {
      submission = await db.submission.update({
        where: { id: existing.id },
        data: {
          proofUrl,
          proofUrls: urls,
          status,
          submittedAt: new Date(),
          reviewedAt: null,
          reason: null,
        },
      });
    } else {
      submission = await db.submission.create({
        data: {
          taskId,
          teamId: player.teamId,
          proofUrl,
          proofUrls: urls,
          status,
        },
      });
    }

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'submission' });

    res.status(201).json({ submission, auto: game.submissionMode === 'AUTOMATIC' });
  } catch (err) {
    console.error('submit failed', err);
    res.status(500).json({ error: 'Could not submit proof' });
  }
});

export default router;
