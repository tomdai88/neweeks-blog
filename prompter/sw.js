// 提词器离线缓存。改了 index.html 之后无需改这里：有网时会在后台自动更新，下次打开就是新版。
// 只有「文件清单」变了（增删图标等），才需要把下面的版本号加 1，让旧缓存被清掉。
const CACHE = 'prompter-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 先给缓存里的版本（秒开、离线可用），同时在后台去网络取最新版更新缓存
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => hit || caches.match('./index.html'));
      e.waitUntil(net.catch(() => {}));
      return hit || net;
    })
  );
});
