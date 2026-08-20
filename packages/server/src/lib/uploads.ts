import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import multer from 'multer';
import { config } from '../config';

mkdirSync(config.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.UPLOAD_DIR);
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
