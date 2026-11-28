// Caches the game so it opens without signal. Bump VERSION when files change.
const VERSION = 'emberwake-v44';
const FILES = ['./', 'index.html', 'audio.js', 'data.js', 'world.js', 'story.js', 'engine.js', 'war.js', 'sprites.js', 'art.js', 'siege.js', 'siegeui.js', 'battlefx.js', 'cine.js', 'game.js', 'theme.css', 'fonts/cinzel-latin-500-normal.woff2', 'fonts/cinzel-latin-700-normal.woff2', 'fonts/cinzel-latin-900-normal.woff2', 'fonts/alegreya-latin-400-normal.woff2', 'fonts/alegreya-latin-700-normal.woff2', 'fonts/alegreya-latin-400-italic.woff2', 'manifest.json', 'icon.svg'];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('emberwake') && k !== VERSION).map(k => caches.delete(k))))
));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    // no-cache: always ask the server for the latest (GitHub Pages would otherwise let the phone reuse files for 10 minutes)
    fetch(e.request, { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
