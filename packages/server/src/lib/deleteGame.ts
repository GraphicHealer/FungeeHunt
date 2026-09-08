import fs from 'fs';
import path from 'path';
import type { Server } from 'socket.io';
import { db } from '../db/client';
import { config } from '../config';
import { uploadPath } from './uploads';

/** Removes a game and everything attached to it (uploads, tasks, teams, players, chat). */
export async function deleteGame(gameId: string, io?: Server): Promise<boolean> {
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) return false;

  const submissions = await db.submission.findMany({
    where: { task: { gameId } },
    select: { proofUrl: true, proofUrls: true },
  });

  const urls = new Set<string>();
  for (const s of submissions) {
    if (s.proofUrl) urls.add(s.proofUrl);
    for (const u of s.proofUrls ?? []) urls.add(u);
  }

  for (const u of urls) {
    for (const toRemove of [u, `${u}.thumb.jpg`]) {
      const p = uploadPath(toRemove);
      if (!p) continue;
      try {
        fs.rmSync(p, { force: true });
      } catch (err) {
        console.error('could not remove upload', p, err);
      }
    }
  }

  try {
    fs.rmSync(path.join(config.UPLOAD_DIR, gameId), { recursive: true, force: true });
  } catch {
    // folder may not exist
  }

  // FK cascades delete players, teams, tasks, submissions, rules, and chat;
  // spectator sessions are detached via ON DELETE SET NULL.
  await db.game.delete({ where: { id: gameId } });

  io?.emit(`game:${game.code.toUpperCase()}`, { type: 'deleted' });
  return true;
}
