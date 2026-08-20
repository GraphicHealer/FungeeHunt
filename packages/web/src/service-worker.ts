/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const SW_VERSION = '1.0.0';
const CACHE = `fungee-hunt-${SW_VERSION}`;

const ASSETS = [
  '/',
  '/login',
  '/favicon.png',
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)),
  );
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener('fetch', (event: any) => {
  if (event.request.method !== 'GET') return;
  const { pathname } = new URL(event.request.url);
  if (pathname.startsWith('/api/') || pathname.startsWith('/socket.io/') || pathname.startsWith('/uploads/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ??
        fetch(event.request).then((network) =>
          caches.open(CACHE).then((cache) => {
            cache.put(event.request, network.clone());
            return network;
          }),
        )
      );
    }),
  );
});
