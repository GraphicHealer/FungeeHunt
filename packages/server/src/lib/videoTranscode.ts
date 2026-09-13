import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { db } from '../db/client';
import { config } from '../config';
import { logger } from './logger';
import { uploadPath } from './uploads';

const MAX_CONCURRENT = 2;
const TARGET_MAX_HEIGHT = 720;
const SKIP_BITRATE_BPS = 3_000_000; // 3 Mbps for H.264-ish, reasonable mobile ceiling
const CRF = 24;
const PRESET = 'faster';
const AUDIO_BITRATE = '128k';

interface ProbeInfo {
  width: number;
  height: number;
  bitRate: number;
  duration: number;
}

interface Job {
  submissionId: string;
  gameId: string;
  proofUrl: string;
}

class VideoTranscodeQueue {
  private pending: Job[] = [];
  private active = new Set<string>();

  add(job: Job) {
    this.pending.push(job);
    this.processNext();
  }

  private processNext() {
    if (this.active.size >= MAX_CONCURRENT || this.pending.length === 0) return;
    const job = this.pending.shift()!;
    this.active.add(job.submissionId);
    this.run(job).finally(() => {
      this.active.delete(job.submissionId);
      this.processNext();
    });
  }

  private async run(job: Job) {
    const input = uploadPath(job.proofUrl);
    if (!input) {
      logger.error('video transcode: missing input path', { submissionId: job.submissionId });
      return this.mark(job.submissionId, 'FAILED');
    }

    try {
      await db.submission.update({
        where: { id: job.submissionId },
        data: { videoStatus: 'PROCESSING' },
      });
    } catch (err) {
      logger.error('video transcode: could not mark PROCESSING', err);
      return;
    }

    let probe: ProbeInfo | null = null;
    try {
      probe = await ffprobe(input);
    } catch (err) {
      logger.error('video transcode: ffprobe failed', { input, err });
      return this.mark(job.submissionId, 'FAILED');
    }

    const estimatedBitRate = probe.bitRate || (statSync(input).size * 8 / probe.duration);
    const shouldSkip =
      probe.height <= TARGET_MAX_HEIGHT &&
      Number.isFinite(estimatedBitRate) &&
      estimatedBitRate <= SKIP_BITRATE_BPS;

    if (shouldSkip) {
      logger.info('video transcode: skipping, source is already small enough', { input, probe });
      return this.mark(job.submissionId, 'READY');
    }

    const outFilename = `t-${randomBytes(8).toString('hex')}.mp4`;
    const outDisk = path.join(config.UPLOAD_DIR, job.gameId, outFilename);
    const outUrl = `/uploads/${job.gameId}/${outFilename}`;

    const timeoutMs = Math.max(60, (probe.duration || 60) * 3 + 30) * 1000;

    try {
      await runFfmpeg(input, outDisk, timeoutMs);
    } catch (err: any) {
      logger.error('video transcode: ffmpeg failed', { input, err: err.message });
      this.safeDelete(outDisk);
      return this.mark(job.submissionId, 'FAILED');
    }

    let outputInfo: ProbeInfo | null = null;
    try {
      outputInfo = await ffprobe(outDisk);
    } catch (err) {
      logger.error('video transcode: output ffprobe failed', { outDisk, err });
      this.safeDelete(outDisk);
      return this.mark(job.submissionId, 'FAILED');
    }

    const stats = statSync(outDisk);
    const valid =
      outputInfo.duration > 0 &&
      outputInfo.height > 0 &&
      stats.size > 0;

    if (!valid) {
      logger.error('video transcode: output validation failed', { outDisk, outputInfo, size: stats.size });
      this.safeDelete(outDisk);
      return this.mark(job.submissionId, 'FAILED');
    }

    // Replace references only after the output is confirmed valid; then remove the original.
    try {
      await db.submission.update({
        where: { id: job.submissionId },
        data: { proofUrl: outUrl, proofUrls: [outUrl], videoStatus: 'READY' },
      });
      this.safeDelete(input);
      logger.info('video transcode: complete', { submissionId: job.submissionId, outUrl });
    } catch (err) {
      logger.error('video transcode: db swap failed, keeping original', err);
      this.safeDelete(outDisk);
      return this.mark(job.submissionId, 'FAILED');
    }
  }

  private async mark(submissionId: string, status: 'READY' | 'FAILED') {
    try {
      await db.submission.update({ where: { id: submissionId }, data: { videoStatus: status } });
    } catch (err) {
      logger.error('video transcode: could not mark status', { submissionId, status, err });
    }
  }

  private safeDelete(filePath: string) {
    try {
      rmSync(filePath, { force: true });
    } catch {
      // best effort
    }
  }
}

export const videoTranscodeQueue = new VideoTranscodeQueue();

function runFfmpeg(input: string, output: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', input,
      '-vf', `scale=-2:'min(${TARGET_MAX_HEIGHT},ih)'`,
      '-c:v', 'libx264',
      '-crf', String(CRF),
      '-preset', PRESET,
      '-c:a', 'aac',
      '-b:a', AUDIO_BITRATE,
      '-movflags', '+faststart',
      output,
    ];

    logger.info(`[FFMPEG] ffmpeg ${args.join(' ')}`);
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let error = '';
    let killed = false;

    child.stderr?.on('data', (data: Buffer) => {
      error += data.toString();
    });

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 && !killed) {
        resolve();
      } else {
        reject(new Error(killed ? 'ffmpeg timed out' : `ffmpeg exited ${code}: ${error}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function ffprobe(file: string): Promise<ProbeInfo> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,bit_rate,duration',
      '-of', 'csv=p=0',
      file,
    ];

    const child = spawn('ffprobe', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let error = '';

    child.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });
    child.stderr?.on('data', (data: Buffer) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe exited ${code}: ${error}`));
      }
      const parts = output.trim().split(',');
      if (parts.length < 4) {
        return reject(new Error(`ffprobe unexpected output: ${output}`));
      }
      const [width, height, bitRate, duration] = parts;
      const result: ProbeInfo = {
        width: parseInt(width, 10) || 0,
        height: parseInt(height, 10) || 0,
        bitRate: parseInt(bitRate, 10) || 0,
        duration: parseFloat(duration) || 0,
      };
      if (result.width === 0 || result.height === 0 || result.duration === 0) {
        return reject(new Error(`ffprobe could not read stream info`));
      }
      resolve(result);
    });

    child.on('error', reject);
  });
}
