// Retro Player – Service Worker (off-line + wake-lock)
const CACHE = 'retro-v1';
const urlsToCache = ['.', 'manifest.json'];

// instalação/off-line
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // ativa imediatamente
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim()); // assume todas as abas
});

// off-line first
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});

// mantém CPU ativa quando a tela apaga (Wake Lock nativo)
self.addEventListener('message', async ev => {
  if (ev.data === 'acquire-wake-lock') {
    try {
      const lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => console.log('WakeLock released'));
    } catch (e) {
      console.warn('Wake Lock não disponível', e);
    }
  }
});
