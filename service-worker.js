const CACHE_NAME = 'candle-pwa-v1';
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.json',
  '/icons/icon-192.png', '/icons/icon-512.png'
];

// install & precache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// activate cleanup
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve())
    )).then(() => self.clients.claim())
  );
});

// fetch: network-first for feed, cache-first for other assets
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // handle API/feed requests with network-first
  if(url.href.includes('/rss') || url.pathname.endsWith('.xml')){
    event.respondWith(
      fetch(req).then(response => {
        // optionally cache the feed
        return response;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // default cache-first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // cache fetched assets (only GET)
      if(req.method === 'GET' && res && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
      }
      return res;
    })).catch(() => caches.match('/'))
  );
});

/* Handle push events (when server sends push) */
self.addEventListener('push', function(event) {
  let payload = {};
  try { payload = event.data.json(); } catch(e) { payload = {title: event.data?.text() || 'New message'}; }
  const title = payload.title || 'Candle';
  const options = Object.assign({
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data || {}
  }, payload.options || {});

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({type:'window'}).then(list => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
