import { db } from '../db/client';

const defaultTasks = [
  {
    title: 'Fungee Photo Op',
    description: 'Take a photo with something shaped like a mushroom.',
    points: 100,
    proofType: 'PHOTO',
    order: 1,
  },
  {
    title: 'Neighborhood Landmark',
    description: 'Find a local landmark and record a short video about it.',
    points: 150,
    proofType: 'VIDEO',
    order: 2,
  },
  {
    title: 'Team Spirit',
    description: 'Photo of the whole team in matching colors.',
    points: 75,
    proofType: 'PHOTO',
    order: 3,
  },
];

const defaultRules = [
  {
    title: 'HOW TO PLAY',
    body: 'Work together as a team to complete as many challenges as possible before time expires.\n\nEvery completed challenge must include photo or video proof as required by the task.',
  },
  {
    title: 'SCORING',
    body: 'Each task is worth the number of points displayed on the task.',
  },
  {
    title: 'RETURN TIME BONUS',
    body: 'Teams that return to the finish during the return window will receive the return bonus points. The Game Master must confirm your return.',
  },
  {
    title: 'FOOD DRIVE BONUS',
    body: 'Each eligible food drive item turned in is worth points. Permissible and suggested items are listed in the game settings.',
  },
];

export const defaultSystemSettings = {
  foodDriveEnabled: true,
  foodDrivePointsPerItem: 1,
  foodDrivePermissible: 'canned goods, boxed pasta, rice, peanut butter',
  foodDriveSuggested: 'soup, canned vegetables, cereal, diapers',
  returnBonusEnabled: true,
  returnBonusWindowMinutes: 10,
  returnBonusPoints: 100,
  defaultRules: JSON.stringify(defaultRules),
  defaultTasks: JSON.stringify(defaultTasks),
};

export async function seedSystemSettings() {
  try {
    const existing = await db.systemSettings.findFirst();
    if (!existing) {
      await db.systemSettings.create({ data: defaultSystemSettings });
      console.log('Seeded default system settings');
    }
  } catch (err) {
    console.error('Could not seed system settings', err);
  }
}

export async function getSystemSettings() {
  let settings = await db.systemSettings.findFirst();
  if (!settings) {
    settings = await db.systemSettings.create({ data: defaultSystemSettings });
  }
  return settings;
}
