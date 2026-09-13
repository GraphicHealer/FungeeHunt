import { execFile } from 'node:child_process';
import { existsSync, renameSync, rmSync } from 'node:fs';
import { logger } from './logger';

export function generateVideoThumb(input: string, output: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    execFile('ffmpeg', [
      '-y',
      '-ss', '00:00:00.250',
      '-i', input,
      '-vf', 'scale=480:480:force_original_aspect_ratio=decrease',
      '-frames:v', '1',
      '-q:v', '2',
      output,
    ], (err) => (err ? reject(err) : resolve()));
  });
}

export function thumbPathForVideo(videoPath: string): string {
  return `${videoPath}.thumb.jpg`;
}

export function moveVideoThumb(fromVideoPath: string, toVideoPath: string) {
  const from = thumbPathForVideo(fromVideoPath);
  const to = thumbPathForVideo(toVideoPath);
  if (!existsSync(from)) {
    return false;
  }
  try {
    rmSync(to, { force: true });
    renameSync(from, to);
    return true;
  } catch (err) {
    logger.error('video transcode: could not move thumbnail', { from, to, err });
    return false;
  }
}

export async function ensureVideoThumb(videoPath: string): Promise<void> {
  const thumb = thumbPathForVideo(videoPath);
  if (existsSync(thumb)) return;
  try {
    await generateVideoThumb(videoPath, thumb);
  } catch (err) {
    logger.error('video thumb: could not generate thumbnail', { videoPath, err });
  }
}
