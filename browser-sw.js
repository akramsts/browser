const CACHE_NAME = 'browser-core-cache-v3';
const ASSETS = [
    './index.html',
    './about.html',
    './apps.html',
    './downloads.html',
    './history.html',
    './settings.html',
    './style.css',
    './pages.css',
    './script.js',
    './theme.js',
    './browser-192.png',
    './browser-512.png',
    './browser-manifest.json'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

function saveToCache(request, response) {
    if (!response || !response.ok) return;
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
}

self.addEventListener('fetch', (e) => {
    const request = e.request;
    if (request.method !== 'GET') return;
    if (new URL(request.url).origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        e.respondWith(
            fetch(request)
                .then((response) => {
                    saveToCache(request, response);
                    return response;
                })
                .catch(() => {
                    return caches.match(request, { ignoreSearch: true })
                        .then((cached) => cached || caches.match('./index.html'));
                })
        );
        return;
    }

    e.respondWith(
        caches.match(request).then((cached) => {
            const network = fetch(request)
                .then((response) => {
                    saveToCache(request, response);
                    return response;
                })
                .catch(() => cached || Response.error());
            return cached || network;
        })
    );
});