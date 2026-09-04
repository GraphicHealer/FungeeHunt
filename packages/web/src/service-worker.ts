/// <reference types="@sveltejs/kit" />

const SW_VERSION = '1.0.2';
const CACHE = `fungee-hunt-${SW_VERSION}`;

self.addEventListener('install', (event: any) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(() => {}));
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => (self as any).clients.claim()),
  );
});

self.addEventListener('fetch', () => {
  // Do not intercept any requests. The previous cache-everything policy
  // was breaking SvelteKit's immutable JS chunks.
});

self.addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    (self as any).registration.showNotification(data.title ?? 'Fungee-Hunt', {
      body: data.body ?? '',
      icon: '/favicon.png',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    (self as any).clients.openWindow(url),
  );
});
