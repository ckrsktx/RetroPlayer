const CACHE = "retro-player-v2";

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
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Nunca cacheia JSON das playlists
  if (url.pathname.endsWith(".json")) {
    event.respondWith(fetch(event.request)); 
    return;
  }

  // Cache first para outros arquivos
  event.respondWith(
    caches.match(event.request).then(res =>
      res || fetch(event.request).catch(() => res)
    )
  );
});
