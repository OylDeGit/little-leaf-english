const RELEASE = 'development';
const CORE_FILES = null;
const ROOT = new URL('./', self.location.href),
  CORE = `little-leaf-core-${RELEASE}`,
  MEDIA = 'little-leaf-media-v2';
const url = (p) => new URL(p, ROOT).href;
async function coreFiles() {
  return (
    CORE_FILES || [
      './',
      'index.html',
      'style.css',
      'app.js',
      'core.js',
      'data.js',
      'vocabulary.js',
      'media.js',
      'icon.svg',
      'manifest.webmanifest',
    ]
  );
}
self.addEventListener('install', (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE);
      for (const file of await coreFiles()) {
        const response = await fetch(url(file), { cache: 'reload' });
        if (!response.ok) throw Error('离线入口缓存失败');
        await cache.put(url(file), response);
      }
      await self.skipWaiting();
    })(),
  ),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      // Do not delete the legacy cache while a v1 tab can still need its bundled module.
      for (const key of await caches.keys())
        if (key.startsWith('little-leaf-core-') && key !== CORE) await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(ROOT.href)) return;
  const asset = new URL(request.url).pathname.includes('/assets/');
  event.respondWith(
    (async () => {
      const cache = await caches.open(asset ? MEDIA : CORE);
      if (asset) {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      }
      try {
        const response = await fetch(request, { cache: 'no-cache' });
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        const hit = await cache.match(request, { ignoreSearch: true });
        if (hit) return hit;
        if (request.mode === 'navigate') {
          const home = await cache.match(url('index.html'));
          if (home) return home;
        }
        return Response.error();
      }
    })(),
  );
});
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'DOWNLOAD') return;
  const port = event.ports[0];
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch(url('offline-assets.json'), { cache: 'no-cache' });
        if (!response.ok) throw Error('离线清单读取失败，请联网重试');
        const files = await response.json();
        let index = 0,
          done = 0;
        async function worker() {
          while (index < files.length) {
            const file = files[index++],
              cache = await caches.open(file.startsWith('assets/') ? MEDIA : CORE),
              target = url(file);
            if (!(await cache.match(target))) {
              const r = await fetch(target, { cache: 'no-cache' });
              if (!r.ok) throw Error('部分内容下载失败，请联网重试');
              await cache.put(target, r);
            }
            done++;
            port.postMessage({ done, total: files.length });
          }
        }
        await Promise.all(Array.from({ length: 6 }, worker));
        port.postMessage({ done, total: files.length, finished: true });
      } catch (err) {
        port.postMessage({
          error:
            err.name === 'QuotaExceededError'
              ? '设备缓存空间不足，请腾出空间后重试'
              : err.message || '离线下载失败，请重试',
        });
      }
    })(),
  );
});
