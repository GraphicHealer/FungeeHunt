import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import type { SystemSettings } from '@prisma/client';
import { db } from '../db/client';
import { parseCsv, parseTaskRows } from '../lib/taskCsv';
import { gmailCredentials, renderEmail, sendEmail, smtpConfig } from '../lib/email';
import { getBaseUrl } from '../lib/urls';
import { verifyGmToken } from '../lib/auth';
import { gmAuth } from '../middleware/gmAuth';

const router = Router();

const GMAIL_SCOPE = 'https://mail.google.com/';

function emailCallbackUrl(req: any) {
  return `${getBaseUrl(req)}/api/gm/settings/email/callback`;
}

// In-memory anti-CSRF state for the Gmail OAuth handshake. A server restart
// simply means the admin has to click "Connect" again.
let pendingOauthState: { state: string; createdAt: number } | null = null;

function publicSettings(settings: SystemSettings) {
  const {
    sessionSecret: _secret,
    vapidPrivateKey: _vapid,
    gmailRefreshToken: _grt,
    gmailUser: _gu,
    ...rest
  } = settings;
  return {
    ...rest,
    emailStatus: {
      smtpConfigured: !!smtpConfig(),
      gmailConfigured: !!gmailCredentials(),
      gmailConnected: !!settings.gmailRefreshToken,
    },
    defaultRules: rest.defaultRules ? JSON.parse(rest.defaultRules) : [],
    defaultTasks: rest.defaultTasks ? JSON.parse(rest.defaultTasks) : [],
    taskCategories: rest.taskCategories ? JSON.parse(rest.taskCategories) : [],
  };
}

// Starts the Gmail OAuth handshake. Requires an admin GM token passed as ?key=
// (browser navigation cannot send Authorization headers). No UI uses this — it
// exists purely so an operator can connect the mailbox after setting env vars.
router.get('/email/connect', async (req, res) => {
  const creds = gmailCredentials();
  if (!creds) {
    return res.status(400).send('GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are not set on the server');
  }
  try {
    const payload = verifyGmToken(String(req.query.key ?? ''));
    if ((payload as any).gameId) return res.status(403).send('Admin token required');
  } catch {
    return res.status(401).send('Unauthorized');
  }
  const state = randomBytes(16).toString('hex');
  pendingOauthState = { state, createdAt: Date.now() };
  res.redirect(
    'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: creds.clientId,
        redirect_uri: emailCallbackUrl(req),
        response_type: 'code',
        scope: GMAIL_SCOPE,
        access_type: 'offline',
        prompt: 'consent',
        state,
      }),
  );
});

// Google redirects here after consent. Public by necessity, but guarded by the
// one-time state value generated in /email/connect.
router.get('/email/callback', async (req, res) => {
  const { code, state, error } = req.query as any;
  if (error) return res.redirect('/admin/settings?email=denied');
  if (!code || !state || !pendingOauthState || pendingOauthState.state !== state) {
    return res.redirect('/admin/settings?email=error');
  }
  pendingOauthState = null;

  try {
    const settings = await db.systemSettings.findFirst();
    const creds = gmailCredentials();
    if (!settings || !creds) {
      return res.redirect('/admin/settings?email=error');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        redirect_uri: emailCallbackUrl(req),
        grant_type: 'authorization_code',
      }),
    });
    const tokens: any = await tokenRes.json();
    if (!tokenRes.ok || !tokens.refresh_token) {
      console.error('gmail token exchange failed', tokens);
      return res.redirect('/admin/settings?email=error');
    }

    // Resolve the connected account's address. The mail scope alone doesn't
    // return an id_token, so ask the Gmail profile endpoint with the access token.
    let email = '';
    try {
      const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (profileRes.ok) {
        const profile: any = await profileRes.json();
        email = profile.emailAddress ?? '';
      }
    } catch { /* fall through to id_token decode */ }
    if (!email && tokens.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString());
        email = payload.email ?? '';
      } catch { /* email stays empty */ }
    }
    if (!email) {
      console.error('gmail oauth succeeded but account email could not be resolved');
      return res.redirect('/admin/settings?email=error');
    }

    await db.systemSettings.update({
      where: { id: settings.id },
      data: { gmailRefreshToken: tokens.refresh_token, gmailUser: email || null },
    });
    res.redirect('/admin/settings?email=connected');
  } catch (err) {
    console.error('gmail oauth callback failed', err);
    res.redirect('/admin/settings?email=error');
  }
});

router.get('/', async (_req, res) => {
  try {
    const settings = await db.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    res.json(publicSettings(settings));
  } catch (err) {
    console.error('get settings failed', err);
    res.status(500).json({ error: 'Could not load settings' });
  }
});

const asBool = (v: any) => v === true || v === 'true' || v === 'on' || v === '1';

function buildSettingsUpdate(body: any) {
  const data: any = {};
  if (body.foodDriveEnabled !== undefined) data.foodDriveEnabled = asBool(body.foodDriveEnabled);
  if (body.foodDrivePointsPerItem !== undefined) data.foodDrivePointsPerItem = Number(body.foodDrivePointsPerItem) || 0;
  if (body.foodDrivePermissible !== undefined) data.foodDrivePermissible = body.foodDrivePermissible;
  if (body.foodDriveSuggested !== undefined) data.foodDriveSuggested = body.foodDriveSuggested;
  if (body.captainCanUpdateFoodDrive !== undefined) data.captainCanUpdateFoodDrive = asBool(body.captainCanUpdateFoodDrive);
  if (body.returnBonusEnabled !== undefined) data.returnBonusEnabled = asBool(body.returnBonusEnabled);
  if (body.returnBonusWindowMinutes !== undefined) data.returnBonusWindowMinutes = Number(body.returnBonusWindowMinutes) || 0;
  if (body.returnBonusPoints !== undefined) data.returnBonusPoints = Number(body.returnBonusPoints) || 0;
  if (body.randomizeReturnBonus !== undefined) data.randomizeReturnBonus = asBool(body.randomizeReturnBonus);
  if (body.autoDeleteHours !== undefined) data.autoDeleteHours = Math.max(0, Math.floor(Number(body.autoDeleteHours) || 0));
  for (const k of ['defaultRules', 'defaultTasks', 'taskCategories'] as const) {
    if (body[k] !== undefined) data[k] = typeof body[k] === 'string' ? body[k] : JSON.stringify(body[k]);
  }
  return data;
}

router.use(gmAuth);

router.post('/email/test', async (req, res) => {
  const { to } = req.body ?? {};
  if (!to || typeof to !== 'string') {
    return res.status(400).json({ error: 'Recipient email is required' });
  }
  try {
    await sendEmail(
      to,
      'Fungee-Hunt email test',
      'Email is configured and working. You can now send game links and notifications from Fungee-Hunt.',
      renderEmail('Email is working', '<p>Email is configured and working. You can now send game links and notifications from Fungee-Hunt.</p>'),
    );
    res.json({ sent: true });
  } catch (err) {
    console.error('test email failed', err);
    res.status(500).json({ error: 'Could not send test email' });
  }
});

router.get('/export', async (_req, res) => {
  try {
    const settings = await db.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    const {
      id: _id,
      sessionSecret: _secret,
      vapidPublicKey: _vapidPub,
      vapidPrivateKey: _vapidPriv,
      gmailRefreshToken: _grt,
      gmailUser: _gu,
      welcomeShown: _welcome,
      tourStep: _tourStep,
      tourDone: _tourDone,
      ...rest
    } = settings;
    res.setHeader('Content-Disposition', 'attachment; filename="fungeehunt-settings.json"');
    res.json({ version: 1, exportedAt: new Date().toISOString(), settings: rest });
  } catch (err) {
    console.error('export settings failed', err);
    res.status(500).json({ error: 'Could not export settings' });
  }
});

router.post('/import', async (req, res) => {
  const incoming = req.body?.settings;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'Invalid settings backup file' });
  }
  try {
    const settings = await db.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data: buildSettingsUpdate(incoming),
    });
    res.json(publicSettings(updated));
  } catch (err) {
    console.error('import settings failed', err);
    res.status(500).json({ error: 'Could not import settings' });
  }
});

router.patch('/', async (req, res) => {
  try {
    const settings = await db.systemSettings.findFirst();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });

    const updated = await db.systemSettings.update({
      where: { id: settings.id },
      data: buildSettingsUpdate(req.body ?? {}),
    });

    res.json(publicSettings(updated));
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
