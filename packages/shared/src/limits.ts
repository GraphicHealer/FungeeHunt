export const FIELD_LIMITS: Record<string, number> = {
  displayName: 50,
  name: 100,
  title: 200,
  description: 2000,
  content: 2000,
  body: 2000,
  message: 1000,
  note: 1000,
  notes: 1000,
  reason: 1000,
  category: 100,
  email: 254,
  gmEmail: 254,
  to: 254,
  from: 254,
  subject: 200,
  code: 8,
  passphrase: 500,
  foodDrivePermissible: 1000,
  foodDriveSuggested: 1000,
  baseUrl: 500,
  proofUrl: 500,
  callbackUrl: 500,
  csv: 1_000_000,
  defaultTasks: 2_000_000,
  defaultRules: 2_000_000,
  taskCategories: 1_000_000,
};

export const DEFAULT_LIMIT = 5_000;

export const POINT_MIN = 0.01;

export const POINT_FIELDS = new Set([
  'points',
  'returnPoints',
  'foodDrivePointsPerItem',
  'returnBonusPoints',
]);
