const CACHE_NAME = 'browser-core-cache-v2';
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

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request).catch(() => caches.match('./index.html'));
        })
    );
});