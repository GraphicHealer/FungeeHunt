import { randomInt } from 'node:crypto';
import { db } from '../db/client';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(length = 6): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    s += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return s;
}

export async function generateGameCode(retries = 10): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const code = randomCode();
    const existing = await db.game.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique game code');
}
