import nodemailer from 'nodemailer';
import { db } from '../db/client';
import { config } from '../config';

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

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
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
