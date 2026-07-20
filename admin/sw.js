const CACHE_NAME = 'j2p-admin-v1';

const urlsToCache = [
  'admin.html',
  'admin.css',
  'admin.js',
  '../favicon.svg',
  'manifest.json',
  'icons/icon-192.svg',
  'icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.map(n => n !== CACHE_NAME && caches.delete(n)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
