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
  const { title, description, points, proofType, order } = req.body ?? {};
  try {
    const game = await db.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const task = await db.task.create({
      data: {
        gameId,
        title: title ?? 'New task',
        description: description ?? '',
        points: Number(points) || 0,
        proofType: ['PHOTO', 'VIDEO', 'EITHER'].includes(proofType) ? proofType : 'PHOTO',
        order: Number(order) || 0,
      },
    });
    res.status(201).json(task);
  } catch (err) {
    console.error('create task failed', err);
    res.status(500).json({ error: 'Could not create task' });
  }
});

router.patch('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { title, description, points, proofType, order } = req.body ?? {};
  try {
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (points !== undefined) data.points = Number(points);
    if (proofType !== undefined && ['PHOTO', 'VIDEO', 'EITHER'].includes(proofType)) {
      data.proofType = proofType;
    }
    if (order !== undefined) data.order = Number(order);

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
