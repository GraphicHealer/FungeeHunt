import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config';

mkdirSync(config.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const gameId = req.gameId as string | undefined;
    if (!gameId) return cb(new Error('gameId not set on request'), '');
    const dir = path.join(config.UPLOAD_DIR, gameId);
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const hash = createHash('sha256').update(`${file.originalname}-${Date.now()}`).digest('hex').slice(0, 16);
    cb(null, `${hash}.${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
  cb(null, ok);
}

export const upload = multer({ storage, fileFilter });

export function uploadPath(proofUrl: string) {
  if (!proofUrl) return '';
  const relative = proofUrl.replace(/^\/uploads\//, '').replace(/^\//, '');
  if (!relative) return '';
  return path.join(config.UPLOAD_DIR, relative);
}

export function uploadExists(proofUrl: string) {
  const p = uploadPath(proofUrl);
  return p ? existsSync(p) : false;
}
