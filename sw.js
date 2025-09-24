const CACHE = 'retro-v1';
const BASE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// instala
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(BASE))
  );
});

// ativa – limpa lixo
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

// fetch
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // playlists JSON → sempre rede primeiro
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request)
        .then(netRes => {
          // guarda a versão nova
          return caches.open(CACHE).then(cache => {
            cache.put(e.request, netRes.clone());
            return netRes;
          });
        })
        .catch(() => caches.match(e.request)) // offline
    );
    return;
  }

  // demais recursos → cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
