const CACHE_NAME = 'wedding-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  // Audio and models are cached as they are fetched via CDN
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  // For Sanity CDN assets (audio/models/images), use a cache-first strategy
  if (event.request.url.includes('cdn.sanity.io')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((response) => {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          return response;
        });
      })
    );
    return;
  }

  // Default network-first strategy for other requests
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});