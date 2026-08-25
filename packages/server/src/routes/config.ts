import { Router } from 'express';
import { getSystemSettings } from '../lib/defaults';
import { config } from '../config';
import { db } from '../db/client';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const settings = await getSystemSettings();
    res.json({
      welcomeShown: settings.welcomeShown,
      tourStep: settings.tourStep,
      tourDone: settings.tourDone,
      defaultPassphrase: config.GM_PASSPHRASE === 'changeme',
    });
  } catch (err) {
    console.error('get config failed', err);
    res.status(500).json({ error: 'Could not load config' });
  }
});

router.patch('/', async (req, res) => {
  try {
    const { welcomeShown, tourStep, tourDone } = req.body ?? {};
    const settings = await getSystemSettings();
    const data: any = {};
    if (welcomeShown !== undefined) data.welcomeShown = welcomeShown === true || welcomeShown === 'true' || welcomeShown === 'on' || welcomeShown === '1';
    if (tourStep !== undefined) data.tourStep = Number(tourStep) || 0;
    if (tourDone !== undefined) data.tourDone = tourDone === true || tourDone === 'true' || tourDone === 'on' || tourDone === '1';
    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data,
    });
    res.json({
      welcomeShown: updated.welcomeShown,
      tourStep: updated.tourStep,
      tourDone: updated.tourDone,
      defaultPassphrase: config.GM_PASSPHRASE === 'changeme',
    });
  } catch (err) {
    console.error('patch config failed', err);
    res.status(500).json({ error: 'Could not update config' });
  }
});

export default router;
