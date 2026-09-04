import webpush from 'web-push';
import { db } from '../db/client';
import { getSystemSettings } from './defaults';

let vapidConfigured = false;

async function configureVapid() {
  if (vapidConfigured) return;
  const settings = await getSystemSettings();
  if (settings.vapidPublicKey && settings.vapidPrivateKey) {
    webpush.setVapidDetails(
      'mailto:admin@fungeehunt.local',
      settings.vapidPublicKey,
      settings.vapidPrivateKey,
    );
    vapidConfigured = true;
  }
}

export async function pushConfigured() {
  const settings = await getSystemSettings();
  return !!(settings.vapidPublicKey && settings.vapidPrivateKey);
}

export async function sendPushToPlayer(playerId: string, title: string, body: string, url?: string) {
  await configureVapid();
  if (!vapidConfigured) return;
  const subs = await db.pushSubscription.findMany({ where: { playerId } });
  const payload = JSON.stringify({ title, body, url });
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        console.error('push failed', err);
      }
    }
  }));
}

export async function sendPushToCaptains(gameId: string, title: string, body: string, url?: string) {
  const teams = await db.team.findMany({ where: { gameId, managerId: { not: null } }, select: { managerId: true } });
  await Promise.all(teams.map((t: any) => sendPushToPlayer(t.managerId, title, body, url)));
}

export async function sendPushToTeams(gameId: string, teamIds: string[], title: string, body: string, url?: string) {
  const teams = await db.team.findMany({ where: { gameId, id: { in: teamIds }, managerId: { not: null } }, select: { managerId: true } });
  await Promise.all(teams.map((t: any) => sendPushToPlayer(t.managerId, title, body, url)));
}
