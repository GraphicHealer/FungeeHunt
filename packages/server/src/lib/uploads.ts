import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config';

mkdirSync(config.UPLOAD_DIR, { recursive: true });

// Stored extension is derived from the (already filtered) mimetype, never from the client filename.
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
  'video/3gpp': '3gp',
};

const BLOCKED_SUBTYPES = new Set(['svg+xml', 'svg']);

export function extensionForMime(mimetype: string): string | null {
  const mime = mimetype.toLowerCase();
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime];
  const [type, subtype = ''] = mime.split('/');
  if ((type !== 'image' && type !== 'video') || BLOCKED_SUBTYPES.has(subtype)) return null;
  const safe = subtype.replace(/^x-/, '').replace(/[^a-z0-9]/g, '');
  return safe || null;
}

const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const gameId = req.gameId as string | undefined;
    if (!gameId) return cb(new Error('gameId not set on request'), '');
    const dir = path.join(config.UPLOAD_DIR, gameId);
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = extensionForMime(file.mimetype);
    if (!ext) return cb(new Error('unsupported file type'), '');
    const hash = createHash('sha256').update(`${file.originalname}-${Date.now()}-${randomBytes(8).toString('hex')}`).digest('hex').slice(0, 16);
    cb(null, `${hash}.${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  cb(null, extensionForMime(file.mimetype) !== null);
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
