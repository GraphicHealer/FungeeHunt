import { config } from '../config';

const levels: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const current = levels[config.LOG_LEVEL] ?? 1;

function stamp(level: string) {
  const now = new Date().toISOString();
  return `[${now}] [${level.toUpperCase()}]`;
}

export const logger = {
  debug: (...args: any[]) => {
    if (current <= 0) console.log(stamp('debug'), ...args);
  },
  info: (...args: any[]) => {
    if (current <= 1) console.log(stamp('info'), ...args);
  },
  warn: (...args: any[]) => {
    if (current <= 2) console.warn(stamp('warn'), ...args);
  },
  error: (...args: any[]) => {
    if (current <= 3) console.error(stamp('error'), ...args);
  },
};
