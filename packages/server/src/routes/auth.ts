import { Router } from 'express';
import { config } from '../config';
import { createGmToken } from '../lib/auth';

const router = Router();

router.post('/gm', (req, res) => {
  const { passphrase } = req.body ?? {};
  if (passphrase !== config.GM_PASSPHRASE) {
    return res.status(401).json({ error: 'Invalid passphrase' });
  }
  res.json({ token: createGmToken() });
});

export default router;
