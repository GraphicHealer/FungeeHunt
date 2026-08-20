import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config';

const SEP = '.';

export function createGmToken(): string {
  const payload = { role: 'gm', iat: Date.now() };
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', config.SESSION_SECRET).update(p).digest('base64url');
  return `${p}${SEP}${sig}`;
}

export function verifyGmToken(token: string) {
  const [p, sig] = token.split(SEP, 2);
  if (!p || !sig) throw new Error('malformed token');
  const expected = createHmac('sha256', config.SESSION_SECRET).update(p).digest('base64url');
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('invalid signature');
  }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.role !== 'gm') throw new Error('not a gm token');
  return payload;
}

export function createPlayerToken(playerId: string, gameId: string): string {
  const payload = { role: 'player', playerId, gameId, iat: Date.now() };
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', config.SESSION_SECRET).update(p).digest('base64url');
  return `${p}${SEP}${sig}`;
}

export function verifyPlayerToken(token: string) {
  const [p, sig] = token.split(SEP, 2);
  if (!p || !sig) throw new Error('malformed token');
  const expected = createHmac('sha256', config.SESSION_SECRET).update(p).digest('base64url');
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('invalid signature');
  }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.role !== 'player') throw new Error('not a player token');
  return payload as { playerId: string; gameId: string };
}
