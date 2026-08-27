import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, execFileSync } from 'node:child_process';
import { db } from '../db/client';
import { config } from '../config';
import { logger } from './logger';
import { getRandomAudioFile, specialAudioFolders } from './audio';

export interface RecapPlan {
  game: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  highlights: any[];
  segments: {
    task: any;
    style: any;
    submissions: any[];
  }[];
  teamPhotoTask: any;
  teamPhotoSubmissions: any[];
  standings: any[];
  isTie: boolean;
  winners: any[];
}

const OUTPUT_SIZE = '1280x720';
const OUTPUT_FPS = 30;
const FONTFILE = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

export function pickTransition(style: any, fallback = 'crossfade') {
  const pool = style?.transitions;
  if (Array.isArray(pool) && pool.length) return pool[Math.floor(Math.random() * pool.length)];
  return fallback;
}

function proofUrlsFor(sub: any) {
  if (sub.proofUrls && sub.proofUrls.length) return sub.proofUrls;
  return sub.proofUrl ? [sub.proofUrl] : [];
}

function localPath(proofUrl: string) {
  const filename = path.basename(proofUrl);
  return path.join(config.UPLOAD_DIR, filename);
}

function escapeText(text: string) {
  return (text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .substring(0, 80);
}

function exists(p: string) {
  return fs.existsSync(p);
}

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ['ffmpeg', ...args].join(' ');
    logger.info(`[FFMPEG] ${command}`);

    const child = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    let output = '';
    let error = '';

    child.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
      logger.debug(data.toString().trim());
    });

    child.stderr?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      error += line + '\n';
      logger.debug(line);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited ${code}: ${error || output}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export async function getRecapPlan(gameId: string): Promise<RecapPlan> {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { teams: { include: { members: true } }, tasks: true },
  });
  if (!game) throw new Error('Game not found');

  const completedSubmissions = await db.submission.findMany({
    where: { task: { gameId }, status: 'COMPLETED' },
    include: { task: true, team: { include: { members: true } } },
    orderBy: { reviewedAt: 'desc' },
  });

  const styleProfiles = await db.styleProfile.findMany();
  const styleMap = new Map(styleProfiles.map((s: any) => [s.category, s]));

  const taskMap = new Map(game.tasks.map((t: any) => [t.id, t]));

  const highlights = completedSubmissions
    .filter((s: any) => s.isHighlight)
    .slice(0, 5);

  const teamPhotoTask = game.tasks.find((t: any) => (t.category ?? '').toLowerCase() === 'team photo');

  const segmentsMap: Record<string, { task: any; style: any; submissions: any[] }> = {};
  for (const sub of completedSubmissions) {
    const task = sub.task;
    if (!task || (task.category ?? '').toLowerCase() === 'team photo') continue;
    if (!segmentsMap[task.id]) {
      segmentsMap[task.id] = {
        task,
        style: styleMap.get(task.category ?? 'General') ?? styleMap.get('General') ?? null,
        submissions: [],
      };
    }
    segmentsMap[task.id].submissions.push(sub);
  }
  const segments = Object.values(segmentsMap).sort((a, b) => a.task.order - b.task.order);

  const teamPhotoSubmissions = completedSubmissions.filter(
    (s: any) => s.task.id === teamPhotoTask?.id,
  );

  const scoreMap = new Map<string, number>();
  for (const sub of completedSubmissions) {
    const task = taskMap.get(sub.taskId);
    if (!task) continue;
    scoreMap.set(sub.teamId, (scoreMap.get(sub.teamId) ?? 0) + task.points);
  }

  const standings = game.teams
    .map((team: any) => {
      const completedScore = scoreMap.get(team.id) ?? 0;
      const returnBonus = team.returnBonusAwarded ? game.returnPoints : 0;
      const foodDriveBonus = team.foodDriveBonusAwarded
        ? (team.foodDriveItems ?? 0) * game.foodDrivePointsPerItem
        : 0;
      return {
        ...team,
        score: completedScore + returnBonus + foodDriveBonus,
      };
    })
    .sort((a: any, b: any) => b.score - a.score);

  const topScore = standings[0]?.score ?? 0;
  const winners = standings.filter((t: any) => t.score === topScore);
  const isTie = winners.length > 1;

  return {
    game: { id: game.id, name: game.name, code: game.code, status: game.status },
    highlights,
    segments,
    teamPhotoTask,
    teamPhotoSubmissions,
    standings,
    isTie,
    winners,
  };
}

export async function updateRecapStatus(gameId: string, status: string, url?: string) {
  await db.game.update({
    where: { id: gameId },
    data: { recapVideoStatus: status, recapVideoUrl: url ?? null },
  });
}

export async function startRecapRender(gameId: string) {
  await updateRecapStatus(gameId, 'RENDERING');
  try {
    const plan = await getRecapPlan(gameId);
    await renderRecap(gameId, plan);
  } catch (err: any) {
    console.error('recap render failed', err);
    await updateRecapStatus(gameId, 'FAILED');
  }
}

async function buildClip(
  input: string,
  output: string,
  options: { duration?: number; textTop?: string; textBottom?: string; textColor?: string; isVideo?: boolean; photoHold?: number }
) {
  if (!exists(input)) throw new Error(`Missing media: ${input}`);

  const textColor = options.textColor ?? '#ffffff';
  const drawTop = options.textTop
    ? `,drawtext=fontfile=${FONTFILE}:text='${escapeText(options.textTop)}':fontcolor=${textColor}:fontsize=18:x=(w-text_w)/2:y=24`
    : '';
  const drawBottom = options.textBottom
    ? `,drawtext=fontfile=${FONTFILE}:text='${escapeText(options.textBottom)}':fontcolor=${textColor}:fontsize=18:x=(w-text_w)/2:y=h-text_h-24`
    : '';

  if (options.isVideo) {
    await runFFmpeg([
      '-y',
      '-i', input,
      '-vf', `scale=${OUTPUT_SIZE}:force_original_aspect_ratio=decrease,pad=${OUTPUT_SIZE}:(ow-iw)/2:(oh-ih)/2:black,setsar=1${drawTop}${drawBottom}`,
      '-r', String(OUTPUT_FPS),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-an',
      output,
    ]);
  } else {
    const frames = Math.max(15, Math.floor((options.photoHold ?? 2.5) * OUTPUT_FPS));
    await runFFmpeg([
      '-y',
      '-framerate', String(OUTPUT_FPS),
      '-loop', '1',
      '-i', input,
      '-t', String(options.photoHold ?? 2.5),
      '-vf', `zoompan=z='min(zoom+0.0015,1.5)':d=${frames}:s=${OUTPUT_SIZE}:fps=${OUTPUT_FPS},setsar=1${drawTop}${drawBottom}`,
      '-r', String(OUTPUT_FPS),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-an',
      output,
    ]);
  }
}

function safeFilename(url: string) {
  return url.replace(/[^a-zA-Z0-9.]/g, '_');
}

async function combineClips(clips: string[], transitions: string[], output: string) {
  if (clips.length === 0) throw new Error('No clips to combine');
  if (clips.length === 1) {
    fs.copyFileSync(clips[0], output);
    return;
  }

  const duration = 0.5;
  let filter = '';
  let label = '0';
  let currentDuration = getClipDuration(clips[0]);

  for (let i = 0; i < clips.length - 1; i++) {
    const nextDuration = getClipDuration(clips[i + 1]);
    const trans = transitions[i % transitions.length] || 'crossfade';
    const actualDur = Math.min(duration, currentDuration * 0.25, nextDuration * 0.25);
    const offset = currentDuration - actualDur;
    const newLabel = `v${i + 1}`;
    filter += `[${label}:v][${i + 1}:v]xfade=transition=${trans}:duration=${actualDur}:offset=${offset.toFixed(2)}[${newLabel}];`;
    label = newLabel;
    currentDuration = offset + nextDuration;
  }

  filter += `[${label}]setsar=1[vout]`;

  const args = ['-y'];
  for (const clip of clips) {
    args.push('-i', clip);
  }
  args.push(
    '-filter_complex', filter,
    '-map', '[vout]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-r', String(OUTPUT_FPS),
    '-preset', 'fast',
    '-an',
    output,
  );

  await runFFmpeg(args);
}

function getClipDuration(clip: string): number {
  try {
    const out = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      clip,
    ], { encoding: 'utf8' });
    return parseFloat(out.trim()) || 2;
  } catch (err) {
    return 2;
  }
}

async function addMusicToSegment(video: string, music: string | null, output: string) {
  const total = getClipDuration(video);

  if (!music || !exists(music)) {
    await runFFmpeg([
      '-y',
      '-i', video,
      '-f', 'lavfi',
      '-i', `anullsrc=r=44100:cl=stereo`,
      '-filter_complex',
      `[1:a]atrim=0:${total.toFixed(2)}[aout]`,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      output,
    ]);
    return;
  }

  const fadeStart = Math.max(0, total - 1);
  const fadeDur = Math.min(1, total);

  await runFFmpeg([
    '-y',
    '-i', video,
    '-i', music,
    '-filter_complex',
    `[1:a]atrim=0:${total.toFixed(2)},afade=t=in:ss=0:d=0.5,afade=t=out:st=${fadeStart.toFixed(2)}:d=${fadeDur.toFixed(2)}[aout]`,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    output,
  ]);
}

async function buildSegment(
  workDir: string,
  name: string,
  clipConfigs: { input: string; isVideo?: boolean; textTop?: string; textBottom?: string; textColor?: string; photoHold?: number }[],
  transitions: string[],
  musicFolder: string | null,
) {
  const clips: string[] = [];
  for (let i = 0; i < clipConfigs.length; i++) {
    const c = clipConfigs[i];
    const output = path.join(workDir, `${name}_clip_${i}.mp4`);
    await buildClip(c.input, output, c);
    clips.push(output);
  }

  const combined = path.join(workDir, `${name}_video.mp4`);
  await combineClips(clips, transitions, combined);

  const music = musicFolder ? getRandomAudioFile(musicFolder) : null;
  const output = path.join(workDir, `${name}.mp4`);
  await addMusicToSegment(combined, music, output);
  return output;
}

async function buildColorCard(text: string, duration: number, output: string, textColor = '#ffffff') {
  await runFFmpeg([
    '-y',
    '-f', 'lavfi',
    '-i', `color=c=black:s=${OUTPUT_SIZE}:d=${duration}:r=${OUTPUT_FPS}`,
    '-vf',
    `drawtext=fontfile=${FONTFILE}:text='${escapeText(text)}':fontcolor=${textColor}:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-r', String(OUTPUT_FPS),
    '-an',
    output,
  ]);
}

async function buildSideBySide(left: string, right: string, leftText: string, rightText: string, output: string) {
  await runFFmpeg([
    '-y',
    '-i', left,
    '-i', right,
    '-filter_complex',
    `[0:v]scale=640:720:force_original_aspect_ratio=decrease,pad=640:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,drawtext=fontfile=${FONTFILE}:text='${escapeText(leftText)}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-text_h-24[l];[1:v]scale=640:720:force_original_aspect_ratio=decrease,pad=640:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,drawtext=fontfile=${FONTFILE}:text='${escapeText(rightText)}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-text_h-24[r];[l][r]hstack=inputs=2[v]`,
    '-map', '[v]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-r', String(OUTPUT_FPS),
    '-an',
    output,
  ]);
}

async function buildScrapbook(photoPaths: string[], output: string, text: string) {
  if (photoPaths.length === 0) {
    await buildColorCard(text, 5, output);
    return;
  }

  const used = photoPaths.slice(0, 12);
  const cols = Math.min(3, used.length);
  const rows = Math.ceil(used.length / cols);
  const w = Math.floor(1280 / cols);
  const h = Math.floor(720 / rows);

  const pads = used.map((_, i) => `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1[p${i}];`).join('');
  const stack = used.map((_, i) => `[p${i}]`).join('');
  const layout = generateLayout(used.length, w, h);

  const args = [
    '-y',
    ...used.map((p) => ['-i', p]).flat(),
    '-filter_complex',
    `${pads}${stack}xstack=inputs=${used.length}:layout=${layout}[v];[v]drawtext=fontfile=${FONTFILE}:text='${escapeText(text)}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2[t]`,
    '-map', '[t]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-r', String(OUTPUT_FPS),
    '-t', '5',
    '-an',
    output,
  ];

  await runFFmpeg(args);
}

function generateLayout(count: number, w: number, h: number): string {
  const cols = Math.min(3, count);
  const positions: string[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push(`${col * w}_${row * h}`);
  }
  return positions.join('|');
}

async function buildFinal(segments: string[], output: string) {
  if (segments.length === 0) throw new Error('No segments to finalize');
  if (segments.length === 1) {
    fs.copyFileSync(segments[0], output);
    return;
  }

  const inputs = segments.map((s, i) => `-i ${JSON.stringify(s)}`).join(' ');
  const chains = segments.map((_, i) => `[${i}:v][${i}:a]`).join('');

  const args = ['-y'];
  for (const seg of segments) args.push('-i', seg);
  args.push(
    '-filter_complex',
    `${chains}concat=n=${segments.length}:v=1:a=1[cout][aout]`,
    '-map', '[cout]',
    '-map', '[aout]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-preset', 'fast',
    output,
  );

  await runFFmpeg(args);
}

function filterExistingPhotos(paths: string[]) {
  return paths.filter(p => exists(p));
}

export async function renderRecap(gameId: string, plan: RecapPlan) {
  logger.info('Starting FFmpeg recap render', { gameId, gameName: plan.game.name });

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fungee-recap-'));
  const outputName = `recap_${gameId}.mp4`;
  const outputPath = path.join(config.UPLOAD_DIR, outputName);

  try {
    const segments: string[] = [];

    // 1. Cold open from highlights
    if (plan.highlights.length) {
      const clips: { input: string; isVideo?: boolean; textTop?: string; textBottom?: string; textColor?: string; photoHold?: number }[] = [];
      for (const sub of plan.highlights) {
        for (const url of proofUrlsFor(sub)) {
          const file = localPath(url);
          const isVideo = sub.task?.proofType === 'VIDEO' || url.endsWith('.mp4') || url.endsWith('.mov');
          clips.push({
            input: file,
            isVideo,
            textTop: 'Best of',
            textBottom: sub.team?.name,
            photoHold: 1.0,
            textColor: '#ffffff',
          });
        }
      }
      const coldOpen = await buildSegment(workDir, 'coldopen', clips, ['dissolve', 'wipeleft', 'slideleft'], specialAudioFolders.coldOpen);
      segments.push(coldOpen);
    }

    // 2. Per-task segments
    for (const segment of plan.segments) {
      const clips: { input: string; isVideo?: boolean; textTop?: string; textBottom?: string; textColor?: string; photoHold?: number }[] = [];
      const style = segment.style ?? { transitions: ['crossfade'], photoHold: 2.5, textColor: '#ffffff' };
      for (const sub of segment.submissions) {
        for (const url of proofUrlsFor(sub)) {
          const file = localPath(url);
          const isVideo = sub.task?.proofType === 'VIDEO' || url.endsWith('.mp4') || url.endsWith('.mov');
          clips.push({
            input: file,
            isVideo,
            textTop: sub.team?.name,
            textBottom: segment.task.title,
            photoHold: style.photoHold ?? 2.5,
            textColor: style.textColor ?? '#ffffff',
          });
        }
      }
      if (clips.length) {
        const taskSegment = await buildSegment(workDir, `task_${segment.task.id}`, clips, style.transitions, style.musicPath);
        segments.push(taskSegment);
      }
    }

    // 3. Winners closer
    const winnerSubmissions = plan.winners
      .flatMap((w: any) => plan.teamPhotoSubmissions.filter((s: any) => s.teamId === w.id));

    const winnerCards: { input: string; isVideo?: boolean; textTop?: string; textBottom?: string; textColor?: string; photoHold?: number }[] = [];

    if (!plan.isTie && winnerSubmissions.length) {
      const winner = plan.winners[0];
      const first = localPath(winnerSubmissions[0].proofUrl);
      const isVideo = winnerSubmissions[0].task?.proofType === 'VIDEO' || first.endsWith('.mp4') || first.endsWith('.mov');
      winnerCards.push({
        input: first,
        isVideo,
        textTop: 'And the winner is...',
        textBottom: winner.name ?? 'Unnamed team',
        photoHold: 3.5,
        textColor: '#ffffff',
      });
      for (const sub of winnerSubmissions) {
        for (const url of proofUrlsFor(sub)) {
          const file = localPath(url);
          const isVideo = sub.task?.proofType === 'VIDEO' || url.endsWith('.mp4') || url.endsWith('.mov');
          winnerCards.push({
            input: file,
            isVideo,
            textTop: winner.name ?? 'Unnamed team',
            textBottom: sub.task?.title,
            photoHold: 0.5,
            textColor: '#ffffff',
          });
        }
      }
    } else if (plan.isTie && winnerSubmissions.length >= 2) {
      const tieFile = path.join(workDir, 'tie_reveal.mp4');
      await buildSideBySide(
        localPath(proofUrlsFor(winnerSubmissions[0])[0]),
        localPath(proofUrlsFor(winnerSubmissions[1])[0]),
        plan.winners[0]?.name ?? 'Tied',
        plan.winners[1]?.name ?? 'Tied',
        tieFile,
      );
      winnerCards.push({
        input: tieFile,
        textTop: 'TIE',
        textBottom: 'It\'s a tie!',
        photoHold: 3.5,
        textColor: '#ffcc00',
      });
    } else {
      const winner = plan.winners[0] || { name: 'Everyone' };
      const card = path.join(workDir, 'winner_card.mp4');
      await buildColorCard(winner.name, 3.5, card, '#ffffff');
      winnerCards.push({ input: card });
    }

    const winnersSegment = await buildSegment(workDir, 'winners', winnerCards, ['wipeleft', 'zoomin'], specialAudioFolders.winners);
    segments.push(winnersSegment);

    // 4. Scrapbook outro
    const allPhotos = filterExistingPhotos(plan.teamPhotoSubmissions.map((s: any) => localPath(s.proofUrl)));
    const outro = path.join(workDir, 'outro.mp4');
    await buildScrapbook(allPhotos, outro, 'Thanks for playing!');
    const outroMusic = getRandomAudioFile(specialAudioFolders.thanksForPlaying);
    const outroWithMusic = path.join(workDir, 'outro_final.mp4');
    await addMusicToSegment(outro, outroMusic, outroWithMusic);
    segments.push(outroWithMusic);

    // 5. Build final
    await buildFinal(segments, outputPath);

    logger.info('Recap complete', { outputPath });
    await updateRecapStatus(gameId, 'READY', `/uploads/${outputName}`);
  } catch (err: any) {
    logger.error('Recap render failed', { gameId, error: err.message });
    throw err;
  } finally {
    // Keep the temp dir around for debugging if the build failed
    if (fs.existsSync(outputPath)) {
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
    }
  }
}
