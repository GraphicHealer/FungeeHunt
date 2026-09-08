import { createHash, randomBytes } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readSync } from 'node:fs';
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

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 512 * 1024 * 1024, files: 10 },
});

// HEIF-family brands that share the ISO-BMFF 'ftyp' container with MP4/MOV video.
const HEIF_BRANDS = new Set([
  'heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs',
  'mif1', 'msf1', 'avif', 'avis',
]);

/** Sniffs the first bytes of a written upload; returns 'image', 'video', or null if unrecognized. */
export function sniffUploadKind(filePath: string): 'image' | 'video' | null {
  try {
    const fd = openSync(filePath, 'r');
    const buf = Buffer.alloc(16);
    const n = readSync(fd, buf, 0, 16, 0);
    closeSync(fd);
    if (n < 12) return null;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image'; // JPEG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image'; // PNG
    if (buf.toString('latin1', 0, 4) === 'GIF8') return 'image'; // GIF
    if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image'; // WebP
    if (buf.toString('latin1', 4, 8) === 'ftyp') {
      const brand = buf.toString('latin1', 8, 12);
      return HEIF_BRANDS.has(brand) ? 'image' : 'video'; // ISO-BMFF: HEIF/AVIF vs MP4/MOV/3GP
    }
    if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video'; // WebM/MKV
    return null;
  } catch {
    return null;
  }
}

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
