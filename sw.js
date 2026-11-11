const CACHE = 'vowway-v9';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-180.png?v=3', 'icon-192.png?v=3', 'icon-512.png?v=3'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname.endsWith('sw.js');
  if (isPage) {
    // the app itself: always try the network first, so updates arrive; fall back to the saved copy offline
    // cache:'no-cache' asks GitHub every time instead of reusing the browser's 10-minute copy
    e.respondWith(fetch(e.request.url, {cache:'no-cache', credentials:'same-origin'}).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html'))));
    return;
  }
  // sounds, voices, icons, fonts: cache first (they never change once published)
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(e.request.url))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
