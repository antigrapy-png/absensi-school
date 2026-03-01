const CACHE_NAME = 'absensi-pwa-v5';
const STATIC_ASSETS = ['/', '/index.html', '/src/app.js', '/src/styles.css',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap'];

// Install
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

// Fetch — cache-first for static, network-first for API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API calls: network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Static: cache first
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, c)); }
    return res;
  })));
});

// Background sync for offline absensi
self.addEventListener('sync', e => {
  if (e.tag === 'sync-absensi') {
    e.waitUntil(syncOfflineAbsensi());
  }
});

async function syncOfflineAbsensi() {
  // Sync any pending offline absensi data
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE' }));
}

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'AbsensiKu', body: 'Ada notifikasi baru' };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: '/icons/icon-192.png', badge: '/icons/icon-72.png',
    tag: data.tag || 'absensi-notif', data: { url: data.url || '/' },
    actions: data.actions || []
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});
