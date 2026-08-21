import { config } from '../config';

const levels: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const current = levels[config.LOG_LEVEL] ?? 1;

export const logger = {
  debug: (...args: any[]) => {
    if (current <= 0) console.log(...args);
  },
  info: (...args: any[]) => {
    if (current <= 1) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (current <= 2) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (current <= 3) console.error(...args);
  },
};
