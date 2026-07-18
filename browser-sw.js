const CACHE_NAME = 'browser-core-cache-v1';
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
    './browser-512.png'
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
                    .filter((key) => key !== CACHE_NAME && key !== 'gree-runner-cache-v2')
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});