import { FIELD_LIMITS, POINT_FIELDS } from '@fungeehunt/shared';

const DEFAULT_LIMIT = 5_000;

function isValidPoint(value: any): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function checkValue(key: string, value: any, path: string[]): string | null {
  if (value == null) return null;

  if (typeof value === 'number') {
    if (POINT_FIELDS.has(key) && !isValidPoint(value)) {
      return `${path.join('.')} must be a positive number`;
    }
    return null;
  }

  if (typeof value === 'string') {
    if (POINT_FIELDS.has(key)) {
      if (!isValidPoint(value)) {
        return `${path.join('.')} must be a positive number`;
      }
      return null;
    }
    const limit = FIELD_LIMITS[key] ?? DEFAULT_LIMIT;
    if (value.length > limit) {
      return `${path.join('.')} exceeds ${limit} characters`;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const err = checkValue(String(i), value[i], [...path, String(i)]);
      if (err) return err;
    }
    return null;
  }

  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const err = checkValue(k, v, [...path, k]);
      if (err) return err;
    }
    return null;
  }

  return null;
}

export function checkBody(body: any): string | null {
  return checkValue('body', body, ['body']);
}
