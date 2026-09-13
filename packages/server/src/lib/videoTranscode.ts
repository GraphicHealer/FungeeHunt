import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { db } from '../db/client';
import { config } from '../config';
import { logger } from './logger';
import { getIo } from './io';
import { uploadPath } from './uploads';

const MAX_CONCURRENT = 2;
const TARGET_MAX_HEIGHT = 720;
const SKIP_BITRATE_BPS = 3_000_000; // 3 Mbps for H.264-ish, reasonable mobile ceiling
const MAX_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour, also avoids 32-bit setTimeout overflow
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
  gameCode: string;
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
      return this.mark(job, 'FAILED');
    }

    try {
      await db.submission.update({
        where: { id: job.submissionId },
        data: { videoStatus: 'PROCESSING' },
      });
      this.emit(job, 'PROCESSING');
    } catch (err) {
      logger.error('video transcode: could not mark PROCESSING', err);
      return;
    }

    let probe: ProbeInfo | null = null;
    try {
      probe = await ffprobe(input);
    } catch (err) {
      logger.error('video transcode: ffprobe failed', { input, err });
      return this.mark(job, 'FAILED');
    }

    const hasBitRate = probe.bitRate > 0;
    const canEstimate = Number.isFinite(probe.duration) && probe.duration > 0 && probe.duration <= 3600;
    const estimatedBitRate = hasBitRate ? probe.bitRate : (canEstimate ? (statSync(input).size * 8 / probe.duration) : Infinity);
    const shouldSkip =
      probe.height <= TARGET_MAX_HEIGHT &&
      Number.isFinite(estimatedBitRate) &&
      estimatedBitRate <= SKIP_BITRATE_BPS;

    if (shouldSkip) {
      logger.info('video transcode: skipping, source is already small enough', { input, probe });
      return this.mark(job, 'READY');
    }

    const outFilename = `t-${randomBytes(8).toString('hex')}.mp4`;
    const outDisk = path.join(config.UPLOAD_DIR, job.gameId, outFilename);
    const outUrl = `/uploads/${job.gameId}/${outFilename}`;

    const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(60, (probe.duration || 60) * 3 + 30) * 1000);

    try {
      await runFfmpeg(input, outDisk, timeoutMs);
    } catch (err: any) {
      logger.error('video transcode: ffmpeg failed', { input, err: err.message });
      this.safeDelete(outDisk);
      return this.mark(job, 'FAILED');
    }

    let outputInfo: ProbeInfo | null = null;
    try {
      outputInfo = await ffprobe(outDisk);
    } catch (err) {
      logger.error('video transcode: output ffprobe failed', { outDisk, err });
      this.safeDelete(outDisk);
      return this.mark(job, 'FAILED');
    }

    const stats = statSync(outDisk);
    const valid =
      outputInfo.duration > 0 &&
      outputInfo.height > 0 &&
      stats.size > 0;

    if (!valid) {
      logger.error('video transcode: output validation failed', { outDisk, outputInfo, size: stats.size });
      this.safeDelete(outDisk);
      return this.mark(job, 'FAILED');
    }

    // Replace references only after the output is confirmed valid; then remove the original.
    try {
      await db.submission.update({
        where: { id: job.submissionId },
        data: { proofUrl: outUrl, proofUrls: [outUrl], videoStatus: 'READY' },
      });
      this.safeDelete(input);
      this.emit(job, 'READY');
      logger.info('video transcode: complete', { submissionId: job.submissionId, outUrl });
    } catch (err) {
      logger.error('video transcode: db swap failed, keeping original', err);
      this.safeDelete(outDisk);
      return this.mark(job, 'FAILED');
    }
  }

  private async mark(job: Job, status: 'PROCESSING' | 'READY' | 'FAILED') {
    try {
      await db.submission.update({ where: { id: job.submissionId }, data: { videoStatus: status } });
      this.emit(job, status);
    } catch (err) {
      logger.error('video transcode: could not mark status', { submissionId: job.submissionId, status, err });
    }
  }

  private emit(job: Job, status: 'PROCESSING' | 'READY' | 'FAILED') {
    try {
      const io = getIo();
      if (io) {
        io.emit(`game:${job.gameCode.toUpperCase()}`, { type: 'submission', submissionId: job.submissionId, videoStatus: status });
      }
    } catch (err) {
      logger.error('video transcode: socket emit failed', err);
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
      '-of', 'json',
      '-show_streams',
      '-show_format',
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
      try {
        const parsed = JSON.parse(output);
        const videoStream = (parsed.streams ?? []).find((s: any) => s.codec_type === 'video');
        const fmt = parsed.format ?? {};
        if (!videoStream) {
          return reject(new Error('ffprobe: no video stream found'));
        }
        const result: ProbeInfo = {
          width: Number(videoStream.width) || 0,
          height: Number(videoStream.height) || 0,
          bitRate: Number(videoStream.bit_rate ?? fmt.bit_rate) || 0,
          duration: Number(fmt.duration ?? videoStream.duration) || 0,
        };
        if (result.width === 0 || result.height === 0) {
          return reject(new Error('ffprobe: could not read stream dimensions'));
        }
        resolve(result);
      } catch (err) {
        reject(new Error(`ffprobe could not parse output: ${err}`));
      }
    });

    child.on('error', reject);
  });
}
