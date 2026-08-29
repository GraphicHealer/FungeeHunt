import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'recap-dev.env') });

process.env.RECAP_DEV = '1';

const { renderRecap } = await import('../lib/recap');

const UPLOAD_DIR = process.env.UPLOAD_DIR;
if (!UPLOAD_DIR) {
  throw new Error('Set UPLOAD_DIR in packages/server/src/scripts/recap-dev.env');
}

const files = fs
  .readdirSync(UPLOAD_DIR)
  .filter((f) => /\.(mp4|mov|jpg|jpeg|png)$/i.test(f))
  .map((f) => path.join(UPLOAD_DIR, f));

if (files.length === 0) {
  throw new Error(`No .mp4/.mov/.jpg/.png files found in ${UPLOAD_DIR}`);
}

const videos = files.filter((f) => /\.(mp4|mov)$/i.test(f));
const photos = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

function fakeSubmission(file: string, index: number) {
  const isVideo = /\.(mp4|mov)$/i.test(file);
  const filename = path.basename(file);
  const teamNum = (index % 2) + 1;
  return {
    id: `dev-sub-${index}`,
    proofUrl: `/uploads/${filename}`,
    proofUrls: undefined as string[] | undefined,
    task: {
      id: `dev-task-${index}`,
      title: `Task ${index + 1}`,
      category: 'General',
      proofType: isVideo ? 'VIDEO' : 'PHOTO',
      points: 100,
    },
    team: { id: `dev-team-${teamNum}`, name: `Team ${teamNum}` },
    teamId: `dev-team-${teamNum}`,
  } as any;
}

const allSubs = files.map(fakeSubmission);
const teamPhotoSubs = photos.slice(0, 6).map((f, i) => fakeSubmission(f, i));

const plan = {
  game: { id: 'dev-recap', name: 'Dev Recap', code: 'DEV', status: 'COMPLETED' },
  highlights: allSubs.slice(0, 3),
  segments: [
    {
      task: { id: 'dev-general', title: 'General', category: 'General', proofType: 'PHOTO' },
      style: {
        transitions: ['fade', 'wipeleft', 'slideleft'],
        photoHold: 2.5,
        textColor: '#ffffff',
      },
      submissions: allSubs.slice(0, Math.min(allSubs.length, 12)),
    },
  ],
  teamPhotoTask: { id: 'dev-team-photo', title: 'Team Photo', category: 'Team Photo' },
  teamPhotoSubmissions: teamPhotoSubs,
  standings: [
    { id: 'dev-team-1', name: 'Team 1', score: 250 },
    { id: 'dev-team-2', name: 'Team 2', score: 175 },
  ],
  isTie: false,
  winners: [{ id: 'dev-team-1', name: 'Team 1', score: 250 }],
};

(async () => {
  await renderRecap(plan.game.id, plan as any);
  console.log('Recap rendered. Check the output directory:', UPLOAD_DIR);
})();
