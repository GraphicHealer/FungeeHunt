export const FIELD_LIMITS: Record<string, number> = {
  // User-facing text fields
  displayName: 50,
  name: 100,         // game name, team name, anything called "name"
  title: 200,        // task title, rule title, bonus title
  description: 2000, // task / rule descriptions
  content: 2000,     // rule sections, messages
  message: 1000,     // GM announcements or chat
  note: 1000,
  notes: 1000,
  category: 100,
  email: 254,
  gmEmail: 254,
  to: 254,
  from: 254,
  subject: 200,
  code: 8,           // game codes

  // Large data that may come in as JSON/CSV strings
  csv: 1_000_000,
  defaultTasks: 2_000_000,
  defaultRules: 2_000_000,
  taskCategories: 1_000_000,

  // URLs / tokens
  baseUrl: 500,
  proofUrl: 500,
  callbackUrl: 500,
};

const DEFAULT_LIMIT = 5_000;

// Numeric point fields that must be finite and non-negative (and may be decimal).
export const POINT_FIELDS = new Set([
  'points',
  'returnPoints',
  'foodDrivePointsPerItem',
  'returnBonusPoints',
]);

function isValidPoint(value: any): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function checkValue(key: string, value: any, path: string[]): string | null {
  if (value == null) return null;

  if (typeof value === 'number') {
    if (POINT_FIELDS.has(key) && !isValidPoint(value)) {
      return `${path.join('.')} must be a non-negative number`;
    }
    return null;
  }

  if (typeof value === 'string') {
    if (POINT_FIELDS.has(key)) {
      if (!isValidPoint(value)) {
        return `${path.join('.')} must be a non-negative number`;
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
