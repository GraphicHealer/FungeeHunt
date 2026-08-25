import { Router } from 'express';
import { db } from '../db/client';

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

export default router;
