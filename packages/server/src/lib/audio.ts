import fs from 'fs';
import path from 'path';

const AUDIO_BASE = 'packages/server/assets/audio';

export const specialAudioFolders = {
  coldOpen: `${AUDIO_BASE}/cold-open`,
  winners: `${AUDIO_BASE}/winners`,
  tie: `${AUDIO_BASE}/tie`,
  thanksForPlaying: `${AUDIO_BASE}/thanks-for-playing`,
};

export function resolveAudioFolder(relativeOrAbsolute: string): string {
  if (path.isAbsolute(relativeOrAbsolute)) return relativeOrAbsolute;
  return path.resolve(process.cwd(), relativeOrAbsolute);
}

export function getRandomAudioFile(folder: string): string | null {
  const resolved = resolveAudioFolder(folder);
  if (!fs.existsSync(resolved)) return null;

  const files = fs
    .readdirSync(resolved)
    .filter((f) => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a'))
    .map((f) => path.join(resolved, f));

  if (!files.length) return null;
  return files[Math.floor(Math.random() * files.length)];
}
