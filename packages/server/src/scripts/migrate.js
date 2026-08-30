const { execSync } = require('child_process');

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

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL or PG_USER, PG_PASS, PG_HOST, and PG_DATABASE must be set');
  process.exit(1);
}

execSync('npx prisma migrate deploy --schema=packages/server/src/db/schema.prisma', { stdio: 'inherit' });
