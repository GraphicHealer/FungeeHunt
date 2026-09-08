import { Router } from 'express';
import { checkGmPassphrase, createGmToken } from '../lib/auth';

const router = Router();

router.post('/gm', (req, res) => {
  const { passphrase } = req.body ?? {};
  if (!checkGmPassphrase(passphrase)) {
    return res.status(401).json({ error: 'Invalid passphrase' });
  }
  res.json({ token: createGmToken() });
});

export default router;
