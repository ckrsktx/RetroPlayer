const CACHE_NAME = 'retro-player-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://raw.githubusercontent.com/ckrsktx/PlayerX/refs/heads/main/AlternativeNow.json',
  'https://raw.githubusercontent.com/ckrsktx/PlayerX/refs/heads/main/1990s.json',
  'https://upload.wikimedia.org/wikipedia/commons/8/84/Music_icon.png'
];

// Instala o Service Worker e armazena em cache os recursos essenciais
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativa o Service Worker e remove caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: buscar da rede primeiro, se falhar usar o cache
self.addEventListener('fetch', (event) => {
  // Para requisições de áudio, usar estratégia diferente
  if (event.request.url.includes('.mp3') || event.request.url.includes('.ogg') || event.request.url.includes('.wav')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request).then((response) => {
          // Armazena a nova resposta em cache
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          // Se a rede falhar, tenta buscar do cache
          return cache.match(event.request);
        });
      })
    );
    return;
  }

  // Para outras requisições (JSON, HTML, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna resposta do cache se disponível
        if (response) {
          return response;
        }

        // Clona a requisição porque ela é um stream e só pode ser usada uma vez
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verifica se recebemos uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta porque ela é um stream e só pode ser usada uma vez
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Background Sync para funcionar com tela desligada
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-audio-sync') {
    console.log('Sincronização em background para áudio');
    // Aqui você pode adicionar lógica para manter o áudio tocando
    // mesmo quando o app está em segundo plano
  }
});

// Notificações
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Music_icon.png',
      badge: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Music_icon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
