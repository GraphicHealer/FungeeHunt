import { Router } from 'express';
import { db } from '../db/client';
import { playerAuth } from '../middleware/playerAuth';
import { upload } from '../lib/uploads';

const router = Router({ mergeParams: true });

router.post('/', playerAuth, upload.single('proof'), async (req, res) => {
  const { taskId } = req.params;
  const player = (res.locals as any).player;
  const game = (res.locals as any).game;

  if (!req.file) {
    return res.status(400).json({ error: 'Photo or video proof is required' });
  }

  if (!player.teamId || !player.team || player.team.managerId !== player.id) {
    return res.status(403).json({ error: 'Only the team manager can submit proof' });
  }

  try {
    const task = await db.task.findFirst({
      where: { id: taskId, gameId: game.id },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const mimetype = req.file.mimetype;
    const isPhoto = mimetype.startsWith('image/');
    const isVideo = mimetype.startsWith('video/');
    const acceptsPhoto = task.proofType === 'PHOTO' || task.proofType === 'EITHER';
    const acceptsVideo = task.proofType === 'VIDEO' || task.proofType === 'EITHER';

    if ((isPhoto && !acceptsPhoto) || (isVideo && !acceptsVideo)) {
      return res.status(400).json({ error: 'This task does not accept that proof type' });
    }

    const isManager = player.id === player.team.managerId;
    if (!isManager) {
      return res.status(403).json({ error: 'Only the team manager can submit proof' });
    }

    const isVideo2 = isVideo; // keep for type narrowing below
    const proofUrl = `/uploads/${req.file.filename}`;

    const status = game.submissionMode === 'AUTOMATIC' ? 'COMPLETED' : 'UNDER_REVIEW';

    const submission = await db.submission.create({
      data: {
        taskId,
        teamId: player.teamId,
        proofUrl,
        status,
      },
    });

    const io = req.app.get('io') as any;
    io.emit(`game:${game.code}`, { type: 'submission' });

    res.status(201).json({ submission, auto: game.submissionMode === 'AUTOMATIC' });
  } catch (err) {
    console.error('submit failed', err);
    res.status(500).json({ error: 'Could not submit proof' });
  }
});

export default router;
