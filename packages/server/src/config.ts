import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PUBLIC_URL: z.string().url(),
  GM_PASSPHRASE: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  WEB_UI: z.coerce.number().int().positive().default(3000),
  FRONTEND_BUILD_DIR: z.string().min(1).default('/app/packages/web/build'),
  UPLOAD_DIR: z.string().min(1),
});

export const config = envSchema.parse(process.env);
