/* Change the version on each published release. No external requests are cached. */
importScripts('./sw-arquivos.js');
const CACHE = 'cozinha-verde-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(self.APP_ARQUIVOS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key=>key.startsWith('cozinha-verde-') && key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  // Query parameters must not prevent an already cached app from opening offline.
  url.search = '';
  const key = new Request(url.href);
  const fresh = fetch(event.request).then(async response => {
    if(response.ok){const cache=await caches.open(CACHE);await cache.put(key,response.clone());}
    return response;
  });
  event.waitUntil(fresh.then(()=>{},()=>{}));
  event.respondWith(caches.match(key).then(cached=>cached || fresh));
});
