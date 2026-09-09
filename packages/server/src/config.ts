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
  SESSION_SECRET: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  WEB_UI: z.coerce.number().int().positive().default(3000),
  FRONTEND_BUILD_DIR: z.string().min(1).default('/app/packages/web/build'),
  UPLOAD_DIR: z.string().min(1),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: z.preprocess((v) => (v === 'false' ? false : v === 'true' || v === undefined || v === '' ? undefined : v), z.boolean().optional()),
  PUBLIC_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const config = envSchema.parse(process.env);
