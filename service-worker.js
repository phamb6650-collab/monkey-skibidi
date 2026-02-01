const CACHE_NAME = 'dashboard-offline-v1';
const ASSETS_TO_CACHE = [
    './index.html',
    './manifest.json',
    // External Libraries (CDNs) - Caching these allows offline usage
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    // Fonts (Google Fonts CSS)
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

// 1. Install Event: Cache core assets immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            // We use addAll for local files, but for CDNs sometimes 'no-cors' is needed if they don't support CORS perfectly for SW
            // However, most modern CDNs support it.
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. Fetch Event: The core offline logic
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests that aren't GET (like API calls if any)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Strategy: Cache First, falling back to Network
            // If found in cache, return it.
            if (cachedResponse) {
                return cachedResponse;
            }

            // If not in cache, fetch from network and cache it for next time (Dynamic Caching)
            return fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Cache the new resource (like font files referenced inside the CSS)
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});