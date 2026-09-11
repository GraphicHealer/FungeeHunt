import { Router } from 'express';
import { checkGmPassphrase, createGmToken } from '../lib/auth';
import { getClientIp, recordFailure, recordSuccess } from '../lib/ipBan';

const router = Router();

router.post('/gm', (req, res) => {
  const ip = getClientIp(req);
  const { passphrase } = req.body ?? {};
  if (!checkGmPassphrase(passphrase)) {
    recordFailure(ip);
    return res.status(401).json({ error: 'Invalid passphrase' });
  }
  recordSuccess(ip);
  res.json({ token: createGmToken() });
});

export default router;
