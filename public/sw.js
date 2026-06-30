// Service worker: NETWORK-FIRST (siempre baja lo nuevo si hay internet;
// usa caché solo offline). Evita servir versiones viejas tras un deploy.
const CACHE = "arena-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) =>
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })())
);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  e.respondWith(
    fetch(req)
      .then((res) => { const c = res.clone(); caches.open(CACHE).then((cache) => cache.put(req, c)); return res; })
      .catch(() => caches.match(req))
  );
});
