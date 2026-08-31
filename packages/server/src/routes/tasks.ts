import { Router } from 'express';
import { db } from '../db/client';
import { parseCsv, parseTaskRows } from '../lib/taskCsv';

const router = Router({ mergeParams: true });

router.get('/', async (req: any, res: any) => {
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

router.post('/', async (req: any, res: any) => {
  const { gameId } = req.params;
  const { title, description, points, proofType, photoCount, order, category, delayMinutes } = req.body ?? {};
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
        proofType: ['PHOTO', 'VIDEO', 'PHOTOS'].includes(proofType) ? proofType : 'PHOTO',
        photoCount: photoCount ? Number(photoCount) : null,
        delayMinutes: delayMinutes !== undefined ? (delayMinutes ? Number(delayMinutes) : null) : null,
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

router.post('/batch', async (req: any, res: any) => {
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

    await db.$transaction(async (tx: any) => {
      for (let i = 0; i < unique.length; i++) {
        const t = unique[i];
        await tx.task.create({
          data: {
            gameId,
            title: (t.title ?? 'Task').trim(),
            description: t.description ?? '',
            points: Number(t.points) || 0,
            proofType: ['PHOTO', 'VIDEO', 'PHOTOS'].includes(t.proofType) ? t.proofType : 'PHOTO',
            photoCount: t.photoCount ? Number(t.photoCount) : null,
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

router.patch('/:taskId', async (req: any, res: any) => {
  const { gameId, taskId } = req.params;
  const { title, description, points, proofType, photoCount, order, category, delayMinutes } = req.body ?? {};
  try {
    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description;
    if (points !== undefined) data.points = Number(points);
    if (proofType !== undefined && ['PHOTO', 'VIDEO', 'PHOTOS'].includes(proofType)) {
      data.proofType = proofType;
    }
    if (photoCount !== undefined) data.photoCount = photoCount ? Number(photoCount) : null;
    if (delayMinutes !== undefined) data.delayMinutes = delayMinutes ? Number(delayMinutes) : null;
    if (order !== undefined) data.order = Number(order);
    if (category !== undefined) data.category = category ?? undefined;

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

router.delete('/:taskId', async (req: any, res: any) => {
  const { taskId } = req.params;
  try {
    await db.task.delete({ where: { id: taskId } });
    res.status(204).end();
  } catch (err) {
    console.error('delete task failed', err);
    res.status(500).json({ error: 'Could not delete task' });
  }
});

router.post('/bulk', async (req: any, res: any) => {
  const { gameId } = req.params;
  const { action, ids, points } = req.body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No tasks selected' });
  }

  try {
    if (action === 'delete') {
      await db.task.deleteMany({ where: { id: { in: ids }, gameId } });
    } else if (action === 'setPoints') {
      if (points === undefined || Number.isNaN(Number(points))) {
        return res.status(400).json({ error: 'A numeric point value is required' });
      }
      await db.task.updateMany({
        where: { id: { in: ids }, gameId },
        data: { points: Number(points) },
      });
    } else {
      return res.status(400).json({ error: 'Unknown bulk action' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('bulk action failed', err);
    res.status(500).json({ error: 'Could not apply bulk action' });
  }
});

router.post('/reorder', async (req: any, res: any) => {
  const { gameId } = req.params;
  const { taskIds } = req.body ?? {};
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({ error: 'No task order provided' });
  }

  try {
    await db.$transaction(async (tx: any) => {
      for (let i = 0; i < taskIds.length; i++) {
        await tx.task.updateMany({
          where: { id: taskIds[i], gameId },
          data: { order: i + 1 },
        });
      }
    });
    res.status(204).end();
  } catch (err) {
    console.error('reorder tasks failed', err);
    res.status(500).json({ error: 'Could not reorder tasks' });
  }
});

router.post('/import', async (req: any, res: any) => {
  const { gameId } = req.params;
  const { csv } = req.body ?? {};
  if (!csv || typeof csv !== 'string') {
    return res.status(400).json({ error: 'CSV content is required' });
  }

  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const rows = parseCsv(csv);
    const parsed = parseTaskRows(rows);
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'No valid task rows found' });
    }

    const existing = await db.task.findMany({
      where: { gameId },
      select: { title: true, order: true },
    });
    const existingTitles = new Set(existing.map((t: any) => t.title.toLowerCase()));
    const maxOrder = Math.max(0, ...existing.map((t: any) => t.order));

    const unique = parsed.filter((t: any) => !existingTitles.has(t.title.toLowerCase()));
    if (unique.length === 0) {
      return res.status(400).json({ error: 'All tasks already exist in this game' });
    }

    await db.$transaction(async (tx: any) => {
      for (let i = 0; i < unique.length; i++) {
        const t = unique[i];
        await tx.task.create({
          data: {
            gameId,
            title: t.title,
            description: t.description,
            points: Number(t.points) || 0,
            proofType: ['PHOTO', 'VIDEO', 'PHOTOS'].includes(t.proofType) ? t.proofType : 'PHOTO',
            photoCount: t.photoCount ? Number(t.photoCount) : null,
            category: t.category ?? undefined,
            order: maxOrder + i + 1,
          },
        });
      }
    });

    res.json({ count: unique.length });
  } catch (err) {
    console.error('import tasks failed', err);
    res.status(500).json({ error: 'Could not import tasks' });
  }
});

export default router;
