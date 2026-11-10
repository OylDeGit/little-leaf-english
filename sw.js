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
      // Keep existing SVG/audio downloads, but free the retired photo assets.
      const media = await caches.open(MEDIA);
      const photoRoots = ['assets/images/', 'assets/photos/'].map((path) => url(path));
      for (const request of await media.keys()) {
        if (
          photoRoots.some((root) => request.url.startsWith(root)) &&
          /\.(?:jpe?g|png|webp|avif)$/i.test(new URL(request.url).pathname)
        ) await media.delete(request);
      }
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
      if (asset) return assetResponse(request,cache);
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

// Audio elements on mobile browsers may request byte ranges. Cache the whole
// file and serve the requested range, rather than trying to cache a 206 response.
async function assetResponse(request,cache){
 const headers=new Headers(request.headers),range=headers.get('range');headers.delete('range');
 const fullRequest=new Request(request,{headers});let response=await cache.match(fullRequest);
 if(!response){response=await fetch(fullRequest);if(response.status===200){try{await cache.put(fullRequest,response.clone());}catch{/* Playback still works when storage is full. */}}}
 return range&&response.status===200?responseForRange(response,range):response;
}
async function responseForRange(response,range){
 const bytes=await response.arrayBuffer(),size=bytes.byteLength,match=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
 const invalid=()=>new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 if(!match||(!match[1]&&!match[2]))return invalid();
 let start,end;
 if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return invalid();start=Math.max(0,size-suffix);end=size-1;}
 else{start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1;}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return invalid();
 const headers=new Headers(response.headers);headers.delete('Content-Encoding');headers.set('Accept-Ranges','bytes');headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));
 return new Response(bytes.slice(start,end+1),{status:206,headers});
}
