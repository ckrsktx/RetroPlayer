const CACHE = "retro-player-v1";

// 1) Arquivos estáticos (playlist.json REMOVIDO)
const FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/sw.js"
];

// 2) Instala – mesma lógica
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
});

// 3) Ativa – limpa caches antigos
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

// 4) Fetch – cache-first para tudo, MENOS playlist.json
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // playlist.json → network-first
  if (url.pathname.endsWith("playlist.json")) {
    e.respondWith(
      fetch(e.request)
        .then(netRes => {
          // atualiza o cache com a versão nova
          return caches.open(CACHE).then(cache => {
            cache.put(e.request, netRes.clone());
            return netRes;
          });
        })
        .catch(() => caches.match(e.request)) // fallback offline
    );
    return;
  }

  // demais recursos → cache-first normal
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
