import { Router } from 'express';
import { db } from '../db/client';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { gameId } = req.params;
  try {
    const tasks = await db.task.findMany({
      where: { gameId },
      orderBy: { order: 'asc' },
    });
    res.json(tasks);
  } catch (err) {
    console.error('list tasks failed', err);
    res.status(500).json({ error: 'Could not list tasks' });
  }
});

router.post('/', async (req, res) => {
  const { gameId } = req.params;
  const { title, description, points, proofType, order, category } = req.body ?? {};
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const normalized = (title ?? '').trim().toLowerCase();
    if (normalized) {
      const existing = await db.task.findFirst({
        where: { gameId, title: { equals: title.trim(), mode: 'insensitive' } },
      });
      if (existing) return res.status(400).json({ error: 'A task with that title already exists' });
    }

    const task = await db.task.create({
      data: {
        gameId,
        title: (title ?? 'New task').trim(),
        description: description ?? '',
        points: Number(points) || 0,
        proofType: ['PHOTO', 'VIDEO'].includes(proofType) ? proofType : 'PHOTO',
        category: category ?? undefined,
        order: Number(order) || 0,
      },
    });
    res.status(201).json(task);
  } catch (err) {
    console.error('create task failed', err);
    res.status(500).json({ error: 'Could not create task' });
  }
});

router.post('/batch', async (req, res) => {
  const { gameId } = req.params;
  const { tasks: items } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No tasks provided' });
  }

  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const existing = await db.task.findMany({
      where: { gameId },
      select: { title: true, order: true },
    });
    const existingTitles = new Set(existing.map((t: any) => t.title.toLowerCase()));
    const maxOrder = Math.max(0, ...existing.map((t: any) => t.order));

    const unique = items.filter((t: any) => !existingTitles.has((t.title ?? '').toLowerCase().trim()));
    if (unique.length === 0) {
      return res.status(400).json({ error: 'All selected tasks already exist' });
    }

    await db.$transaction(async (tx) => {
      for (let i = 0; i < unique.length; i++) {
        const t = unique[i];
        await tx.task.create({
          data: {
            gameId,
            title: (t.title ?? 'Task').trim(),
            description: t.description ?? '',
            points: Number(t.points) || 0,
            proofType: ['PHOTO', 'VIDEO'].includes(t.proofType) ? t.proofType : 'PHOTO',
            category: t.category ?? undefined,
            order: maxOrder + i + 1,
          },
        });
      }
    });

    res.status(201).json({ count: unique.length });
  } catch (err) {
    console.error('batch create tasks failed', err);
    res.status(500).json({ error: 'Could not add tasks' });
  }
});

router.patch('/:taskId', async (req, res) => {
  const { gameId, taskId } = req.params;
  const { title, description, points, proofType, order } = req.body ?? {};
  try {
    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description;
    if (points !== undefined) data.points = Number(points);
    if (proofType !== undefined && ['PHOTO', 'VIDEO'].includes(proofType)) {
      data.proofType = proofType;
    }
    if (order !== undefined) data.order = Number(order);

    if (data.title) {
      const existing = await db.task.findFirst({
        where: {
          gameId,
          id: { not: taskId },
          title: { equals: data.title, mode: 'insensitive' },
        },
      });
      if (existing) return res.status(400).json({ error: 'A task with that title already exists' });
    }

    const task = await db.task.update({ where: { id: taskId }, data });
    res.json(task);
  } catch (err) {
    console.error('update task failed', err);
    res.status(500).json({ error: 'Could not update task' });
  }
});

router.delete('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  try {
    await db.task.delete({ where: { id: taskId } });
    res.status(204).end();
  } catch (err) {
    console.error('delete task failed', err);
    res.status(500).json({ error: 'Could not delete task' });
  }
});

export default router;
