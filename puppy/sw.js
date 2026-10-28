// Caches the app so it opens without signal. Bump VERSION when files change.
const VERSION = 'puppy-v19';
const FILES = ['./', 'index.html', 'manifest.json', 'icon.svg'];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
));
self.addEventListener('fetch', e => {
  // Only the app's own files and the sync library are cached. Live sync traffic goes straight to the network.
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || (url.origin !== location.origin && url.hostname !== 'www.gstatic.com')) return;
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
