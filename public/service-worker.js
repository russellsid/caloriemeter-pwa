// SW version bump to force update across devices
const SW_VERSION = 'v3';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { self.clients.claim(); });
// We’ll add caching later; for now this just ensures clients get fresh JS on each deploy.
