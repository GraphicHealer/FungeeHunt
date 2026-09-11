import nodemailer from 'nodemailer';
import { db } from '../db/client';
import { config } from '../config';
import { logger } from './logger';

/**
 * In-memory per-recipient email rate limiter.
 * Prevents one actor from using repeated game creation to spam an arbitrary address.
 * For a multi-replica deployment this would need Redis; for self-hosted single-container it's fine.
 */
const EMAIL_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_RATE_LIMIT_MAX = 10;
const emailAttempts = new Map<string, number[]>();

function checkEmailRateLimit(to: string) {
  const now = Date.now();
  const recipients = to.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
  for (const recipient of recipients) {
    const history = emailAttempts.get(recipient) ?? [];
    const recent = history.filter((t) => now - t < EMAIL_RATE_LIMIT_WINDOW_MS);
    if (recent.length >= EMAIL_RATE_LIMIT_MAX) {
      throw new Error(`Email rate limit exceeded for ${recipient}`);
    }
    recent.push(now);
    emailAttempts.set(recipient, recent);
  }
}

type SmtpConfig = { host: string; port: number; user?: string; pass?: string; from: string; secure: boolean };

/** SMTP config comes exclusively from environment variables. */
export function smtpConfig(): SmtpConfig | null {
  if (config.SMTP_HOST && config.SMTP_PORT && config.SMTP_FROM) {
    return {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
      from: config.SMTP_FROM,
      secure: config.SMTP_SECURE ?? true,
    };
  }
  return null;
}

/** Gmail OAuth client credentials come exclusively from environment variables. */
export function gmailCredentials() {
  if (config.GMAIL_CLIENT_ID && config.GMAIL_CLIENT_SECRET) {
    return { clientId: config.GMAIL_CLIENT_ID, clientSecret: config.GMAIL_CLIENT_SECRET };
  }
  return null;
}

/** SMTP wins when configured; Gmail is used otherwise. */
export async function emailBackend(): Promise<'smtp' | 'gmail' | null> {
  if (smtpConfig()) return 'smtp';
  const s = await db.systemSettings.findFirst();
  if (gmailCredentials() && s?.gmailRefreshToken && s?.gmailUser) return 'gmail';
  return null;
}

export async function emailReady() {
  return (await emailBackend()) !== null;
}

/**
 * Wraps content in the Fungee-Hunt branded email shell — mirrors the web UI
 * (light background, white card, brand blue, same system font stack).
 * All styles are inline since email clients strip <style> blocks.
 */
export function renderEmail(title: string, bodyHtml: string, cta?: { text: string; url: string }) {
  const button = cta
    ? `<a href="${cta.url}" class="fh-btn" style="display:inline-block;background:#0366d6;color:#ffffff;font-weight:600;font-size:1rem;text-decoration:none;padding:0.75rem 1.5rem;border-radius:0.5rem;margin-top:1.25rem;">${cta.text}</a>`
    : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  /* Dark-mode overrides for clients that support prefers-color-scheme
     (Apple Mail, iOS Mail, some others). Mirrors [data-theme="dark"]. */
  @media (prefers-color-scheme: dark) {
    .fh-body { background: #0d1117 !important; }
    .fh-brand { color: #58a6ff !important; }
    .fh-card { background: #161b22 !important; border-color: #30363d !important; }
    .fh-text { color: #f0f6fc !important; }
    .fh-muted { color: #8b949e !important; }
    .fh-btn { background: #1f6feb !important; }
  }
</style>
</head>
<body class="fh-body" style="margin:0;padding:0;background:#f5f7fa;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1f2328;line-height:1.5;">
  <div style="padding:2rem 1rem;">
    <div style="max-width:28rem;margin:0 auto;">
      <h1 class="fh-brand" style="color:#0366d6;font-size:1.5rem;margin:0 0 1rem;text-align:center;">FUNGEE-HUNT</h1>
      <div class="fh-card" style="background:#ffffff;border:1px solid #d0d7de;border-radius:0.75rem;box-shadow:0 4px 16px rgba(31,35,40,0.08);padding:2rem;">
        <h2 class="fh-brand" style="color:#0366d6;font-size:1.25rem;margin:0 0 1rem;text-align:center;">${title}</h2>
        <div class="fh-text" style="color:#1f2328;text-align:center;">${bodyHtml}</div>
        <div style="text-align:center;">${button}</div>
      </div>
      <p class="fh-muted" style="color:#656d76;font-size:0.8rem;text-align:center;margin:1.5rem 0 0;">Sent by Fungee-Hunt — self-hosted scavenger hunts.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Base URL for links inside emails: PUBLIC_URL env wins, then the URL captured at game creation. */
export function gameBaseUrl(game: { baseUrl?: string | null }) {
  return (config.PUBLIC_URL ?? game.baseUrl ?? '').replace(/\/$/, '');
}

function centeredCodeBox(content: string) {
  return `<div style="display:inline-block;background:#f5f7fa;border:1px solid #d0d7de;border-radius:0.5rem;padding:0.75rem 1.25rem;font-family:monospace,Consolas,Menlo,Courier,monospace;font-size:1.2rem;word-break:break-all;text-align:center;">${content}</div>`;
}

function playerInfoBlock(code: string, joinUrl: string) {
  return `<p style="margin:0.25rem 0 0;color:#656d76;font-size:0.9rem;">Player code</p>` +
    `<div style="margin:0.25rem 0 1rem;">${centeredCodeBox(escapeHtml(code))}</div>` +
    `<p style="margin:0.5rem 0 0;color:#656d76;font-size:0.9rem;">Or copy this link:</p>` +
    `<div style="margin:0.25rem 0 1rem;"><a href="${joinUrl}" style="text-decoration:none;color:inherit;">${centeredCodeBox(escapeHtml(joinUrl))}</a></div>`;
}

export async function sendGameCreatedEmail(game: { name: string; code: string; gmEmail: string; baseUrl?: string | null }, gmLink?: string) {
  const base = gameBaseUrl(game);
  const joinUrl = `${base}/play/${game.code}`;
  const body =
    `<p>Your game <strong>${escapeHtml(game.name)}</strong> is set up and ready.</p>` +
    playerInfoBlock(game.code, joinUrl);
  await sendEmail(
    game.gmEmail,
    `Fungee-Hunt: "${game.name}" created`,
    `Game "${game.name}" created.\nPlayer code: ${game.code}\nJoin: ${joinUrl}${gmLink ? `\nGM link: ${gmLink}` : ''}`,
    renderEmail('Game created', body, gmLink ? { text: 'OPEN GM DASHBOARD', url: gmLink } : undefined),
  );
}

export async function sendGameReminderEmail(game: { name: string; code: string; gmEmail: string; startAt?: Date | null; baseUrl?: string | null }, gmLink?: string) {
  const base = gameBaseUrl(game);
  const joinUrl = `${base}/play/${game.code}`;
  const when = game.startAt ? game.startAt.toLocaleString() : 'soon';
  const body =
    `<p>Reminder: <strong>${escapeHtml(game.name)}</strong> starts at <strong>${when}</strong>.</p>` +
    playerInfoBlock(game.code, joinUrl);
  await sendEmail(
    game.gmEmail,
    `Fungee-Hunt: "${game.name}" starts soon`,
    `Reminder: "${game.name}" starts at ${when}.\nPlayer code: ${game.code}\nJoin: ${joinUrl}${gmLink ? `\nGM link: ${gmLink}` : ''}`,
    renderEmail('Game starts soon', body, gmLink ? { text: 'OPEN GM DASHBOARD', url: gmLink } : undefined),
  );
}

export async function sendGameDeleteWarningEmail(game: { name: string; code: string; gmEmail: string; baseUrl?: string | null }, deleteAt: Date, archiveLink?: string) {
  const body =
    `<p><strong>${escapeHtml(game.name)}</strong> will be automatically deleted at <strong>${deleteAt.toLocaleString()}</strong>.</p>` +
    `<p>If you want to keep the submissions, open the game dashboard or spectator archive and download them before then.</p>`;
  await sendEmail(
    game.gmEmail,
    `Fungee-Hunt: "${game.name}" will be deleted soon`,
    `"${game.name}" will be deleted at ${deleteAt.toLocaleString()}.${archiveLink ? ` Archive: ${archiveLink}` : ''}`,
    renderEmail('Deletion warning', body, archiveLink ? { text: 'OPEN ARCHIVE', url: archiveLink } : undefined),
  );
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  checkEmailRateLimit(to);
  const backend = await emailBackend();
  if (!backend) throw new Error('Email is not configured');

  if (backend === 'smtp') {
    const s = smtpConfig()!;
    const transport = nodemailer.createTransport({
      host: s.host,
      port: s.port,
      secure: s.secure,
      auth: s.user ? { user: s.user, pass: s.pass ?? '' } : undefined,
    });
    await transport.sendMail({ from: s.from, to, subject, text, html });
    return;
  }

  const settings = await db.systemSettings.findFirst();
  const creds = gmailCredentials()!;
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: settings!.gmailUser!,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      refreshToken: settings!.gmailRefreshToken!,
    },
  });
  await transport.sendMail({ from: `Fungee-Hunt <${settings!.gmailUser}>`, to, subject, text, html });
}
