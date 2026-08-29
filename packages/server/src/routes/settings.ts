import { Router } from 'express';
import { db } from '../db/client';
import { parseCsv, parseTaskRows } from '../lib/taskCsv';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const settings = await db.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    res.json({
      ...settings,
      defaultRules: settings.defaultRules ? JSON.parse(settings.defaultRules) : [],
      defaultTasks: settings.defaultTasks ? JSON.parse(settings.defaultTasks) : [],
      taskCategories: settings.taskCategories ? JSON.parse(settings.taskCategories) : [],
    });
  } catch (err) {
    console.error('get settings failed', err);
    res.status(500).json({ error: 'Could not load settings' });
  }
});

router.patch('/', async (req, res) => {
  const {
    foodDriveEnabled,
    foodDrivePointsPerItem,
    foodDrivePermissible,
    foodDriveSuggested,
    captainCanUpdateFoodDrive,
    returnBonusEnabled,
    returnBonusWindowMinutes,
    returnBonusPoints,
    randomizeReturnBonus,
    defaultRules,
    defaultTasks,
    taskCategories,
  } = req.body ?? {};

  try {
    const settings = await db.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });

    const data: any = {};
    if (foodDriveEnabled !== undefined) data.foodDriveEnabled = foodDriveEnabled === true || foodDriveEnabled === 'true' || foodDriveEnabled === 'on' || foodDriveEnabled === '1';
    if (foodDrivePointsPerItem !== undefined) data.foodDrivePointsPerItem = Number(foodDrivePointsPerItem) || 0;
    if (foodDrivePermissible !== undefined) data.foodDrivePermissible = foodDrivePermissible;
    if (foodDriveSuggested !== undefined) data.foodDriveSuggested = foodDriveSuggested;
    if (captainCanUpdateFoodDrive !== undefined) data.captainCanUpdateFoodDrive = captainCanUpdateFoodDrive === true || captainCanUpdateFoodDrive === 'true' || captainCanUpdateFoodDrive === 'on' || captainCanUpdateFoodDrive === '1';
    if (returnBonusEnabled !== undefined) data.returnBonusEnabled = returnBonusEnabled === true || returnBonusEnabled === 'true' || returnBonusEnabled === 'on' || returnBonusEnabled === '1';
    if (returnBonusWindowMinutes !== undefined) data.returnBonusWindowMinutes = Number(returnBonusWindowMinutes) || 0;
    if (returnBonusPoints !== undefined) data.returnBonusPoints = Number(returnBonusPoints) || 0;
    if (randomizeReturnBonus !== undefined) data.randomizeReturnBonus = randomizeReturnBonus === true || randomizeReturnBonus === 'true' || randomizeReturnBonus === 'on' || randomizeReturnBonus === '1';
    if (defaultRules !== undefined) data.defaultRules = typeof defaultRules === 'string' ? defaultRules : JSON.stringify(defaultRules);
    if (defaultTasks !== undefined) data.defaultTasks = typeof defaultTasks === 'string' ? defaultTasks : JSON.stringify(defaultTasks);
    if (taskCategories !== undefined) data.taskCategories = typeof taskCategories === 'string' ? taskCategories : JSON.stringify(taskCategories);

    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data,
    });

    res.json({
      ...updated,
      defaultRules: updated.defaultRules ? JSON.parse(updated.defaultRules) : [],
      defaultTasks: updated.defaultTasks ? JSON.parse(updated.defaultTasks) : [],
      taskCategories: updated.taskCategories ? JSON.parse(updated.taskCategories) : [],
    });
  } catch (err) {
    console.error('update settings failed', err);
    res.status(500).json({ error: 'Could not update settings' });
  }
});

router.post('/tasks', async (req: any, res: any) => {
  const { csv } = req.body ?? {};
  if (!csv || typeof csv !== 'string') {
    return res.status(400).json({ error: 'CSV content is required' });
  }

  try {
    const rows = parseCsv(csv);
    const tasks = parseTaskRows(rows);
    if (tasks.length === 0) {
      return res.status(400).json({ error: 'No valid task rows found' });
    }
    const settings = await db.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    await db.systemSettings.update({
      where: { id: settings.id },
      data: { defaultTasks: JSON.stringify(tasks) },
    });
    res.json({ count: tasks.length });
  } catch (err) {
    console.error('import default tasks failed', err);
    res.status(500).json({ error: 'Could not import tasks' });
  }
});

router.post('/default-tasks', async (req: any, res: any) => {
  const task = req.body?.task;
  if (!task || !task.title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const settings = await db.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    const list = settings.defaultTasks ? JSON.parse(settings.defaultTasks) : [];
    const clean = {
      title: task.title,
      description: task.description ?? '',
      points: Number(task.points) || 0,
      proofType: task.proofType ?? 'PHOTO',
      category: task.category ?? 'General',
    };
    const idx = list.findIndex((t: any) => t.title?.toLowerCase() === clean.title.toLowerCase());
    const updated = idx >= 0 ? 'updated' : 'saved';
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...clean };
    } else {
      list.push(clean);
    }
    await db.systemSettings.update({
      where: { id: settings.id },
      data: { defaultTasks: JSON.stringify(list) },
    });
    res.json({ updated, count: list.length });
  } catch (err) {
    console.error('save default task failed', err);
    res.status(500).json({ error: 'Could not save task to database' });
  }
});

export default router;
