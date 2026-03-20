/// <reference lib="webworker" />

const CACHE_NAME = 'sodaterutchi-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/apple-touch-icon.png',
];

// インストール時に静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ネットワーク優先、フォールバックでキャッシュ
self.addEventListener('fetch', (event) => {
  // API呼び出しやSupabaseリクエストはキャッシュしない
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したレスポンスをキャッシュに保存
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ──────────────────────────────────────
// 12時のお昼ごはんプッシュ通知
// ──────────────────────────────────────

function scheduleNoonNotification() {
  const now = new Date();
  const noon = new Date(now);
  noon.setHours(12, 0, 0, 0);

  // 既に12時を過ぎていたら翌日の12時に設定
  if (now >= noon) {
    noon.setDate(noon.getDate() + 1);
  }

  const msUntilNoon = noon.getTime() - now.getTime();

  setTimeout(() => {
    self.registration.showNotification('そだてるっち', {
      body: 'そだてるっちにお昼ごはんをあげよう！',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'lunch-reminder',
      renotify: true,
    });
    // 次の日の12時もスケジュール
    scheduleNoonNotification();
  }, msUntilNoon);
}

// Service Worker起動時にスケジュール開始
scheduleNoonNotification();

// 通知クリックでアプリを開く
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 既に開いているタブがあればフォーカス
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      // なければ新しいタブで開く
      return self.clients.openWindow('/');
    })
  );
});
