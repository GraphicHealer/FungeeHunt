import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config';
import { db } from '../db/client';
import { logger } from './logger';

const SEP = '.';
const DEFAULT_SECRET = 'changeme';

let sessionSecret = '';

/**
 * Resolve the HMAC secret used to sign GM and player tokens. Prefers SESSION_SECRET from the
 * environment; otherwise uses a random secret generated on first boot and persisted in
 * SystemSettings so tokens survive container rebuilds as long as the database does.
 */
export async function loadSessionSecret() {
  if (config.SESSION_SECRET && config.SESSION_SECRET !== DEFAULT_SECRET) {
    sessionSecret = config.SESSION_SECRET;
    return;
  }
  if (config.SESSION_SECRET === DEFAULT_SECRET) {
    logger.warn('SESSION_SECRET is the default "changeme"; ignoring it and using the auto-generated secret instead.');
  }

  const settings = await db.systemSettings.findFirst({ select: { id: true, sessionSecret: true } });
  if (!settings) throw new Error('SystemSettings must be seeded before loading the session secret');
  if (settings.sessionSecret) {
    sessionSecret = settings.sessionSecret;
    return;
  }

  const generated = randomBytes(32).toString('base64url');
  const updated = await db.systemSettings.update({
    where: { id: settings.id },
    data: { sessionSecret: generated },
    select: { sessionSecret: true },
  });
  sessionSecret = updated.sessionSecret ?? generated;
  logger.info('Generated a new session secret and stored it in the database.');
}

function secret() {
  if (!sessionSecret) throw new Error('session secret not loaded');
  return sessionSecret;
}

export function checkGmPassphrase(candidate: unknown): boolean {
  if (typeof candidate !== 'string') return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(config.GM_PASSPHRASE);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createGmToken(gameId?: string): string {
  const payload: any = { role: 'gm', iat: Date.now() };
  if (gameId) payload.gameId = gameId;
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(p).digest('base64url');
  return `${p}${SEP}${sig}`;
}

export function verifyGmToken(token: string) {
  const [p, sig] = token.split(SEP, 2);
  if (!p || !sig) throw new Error('malformed token');
  const expected = createHmac('sha256', secret()).update(p).digest('base64url');
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('invalid signature');
  }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.role !== 'gm') throw new Error('not a gm token');
  return payload;
}

export function createPlayerToken(playerId: string, gameId: string): string {
  const payload = { role: 'player', playerId, gameId, iat: Date.now() };
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(p).digest('base64url');
  return `${p}${SEP}${sig}`;
}

export function verifyPlayerToken(token: string) {
  const [p, sig] = token.split(SEP, 2);
  if (!p || !sig) throw new Error('malformed token');
  const expected = createHmac('sha256', secret()).update(p).digest('base64url');
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('invalid signature');
  }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.role !== 'player') throw new Error('not a player token');
  return payload as { playerId: string; gameId: string };
}
