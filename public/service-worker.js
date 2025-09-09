// public/service-worker.js
const SW_VERSION = 'v15';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// No caching yet — always go to the network for the latest assets
self.addEventListener('fetch', () => {});
