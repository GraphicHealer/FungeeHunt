import 'dotenv/config';
import { z } from 'zod';

const {
  PG_USER,
  PG_PASS,
  PG_HOST,
  PG_PORT,
  PG_DATABASE,
} = process.env;

if (PG_USER && PG_PASS && PG_HOST && PG_DATABASE) {
  process.env.DATABASE_URL = `postgresql://${PG_USER}:${encodeURIComponent(PG_PASS)}@${PG_HOST}:${PG_PORT || '5432'}/${PG_DATABASE}`;
}

const envSchema = z.object({
  GM_PASSPHRASE: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  WEB_UI: z.coerce.number().int().positive().default(3000),
  FRONTEND_BUILD_DIR: z.string().min(1).default('/app/packages/web/build'),
  UPLOAD_DIR: z.string().min(1),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const config = envSchema.parse(process.env);
