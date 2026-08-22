import type { Request } from 'express';

export function getBaseUrl(req: Request): string {
  const proto = (req.get('x-forwarded-proto') ?? req.protocol).split(',')[0].trim();
  const host = (req.get('x-forwarded-host') ?? req.get('host') ?? 'localhost').split(',')[0].trim();
  return `${proto}://${host}`;
}
