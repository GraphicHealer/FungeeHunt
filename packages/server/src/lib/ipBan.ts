import { logger } from './logger';

const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BAN_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const failures = new Map<string, number[]>();
const bannedUntil = new Map<string, number>();

export function getClientIp(req: { ip?: string; connection?: { remoteAddress?: string } }): string {
  return req.ip ?? req.connection?.remoteAddress ?? 'unknown';
}

export function isBanned(ip: string): boolean {
  const until = bannedUntil.get(ip);
  if (!until) return false;
  if (Date.now() >= until) {
    bannedUntil.delete(ip);
    failures.delete(ip);
    return false;
  }
  return true;
}

/**
 * Record a failed authentication / authorization / lookup attempt from an IP.
 * Returns true if the IP is now banned.
 */
export function recordFailure(ip: string): boolean {
  if (isBanned(ip)) return true;
  const now = Date.now();
  const history = failures.get(ip)?.filter((t) => now - t < FAILURE_WINDOW_MS) ?? [];
  history.push(now);
  failures.set(ip, history);
  if (history.length >= MAX_FAILURES) {
    bannedUntil.set(ip, now + BAN_DURATION_MS);
    failures.delete(ip);
    logger.warn(`IP banned for ${BAN_DURATION_MS / 1000}s after ${history.length} failures: ${ip}`);
    return true;
  }
  return false;
}

export function recordSuccess(ip: string) {
  failures.delete(ip);
}

export function ipBanMessage(ip: string) {
  const until = bannedUntil.get(ip);
  const seconds = until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0;
  return `IP banned. Try again in ${seconds} seconds.`;
}
