/* Sezam — service worker : app installable + hors-ligne.
   Stratégie :
   - documents HTML → réseau d'abord (on récupère toujours la dernière version quand on est en ligne),
     cache en secours (l'app reste utilisable hors-ligne) ;
   - autres ressources → cache d'abord, mise à jour en fond (stale-while-revalidate). */
const CACHE_NAME = "sezam-solado-v32";
const CACHE_PREFIX = "sezam-solado-";
const LEGACY_CACHE_NAMES = ["sezam-v12", "sezam-v21", "sezam-v23"];
// Caches de cette application avant le rebranding (préfixes historiques). Jamais ceux d'une autre app (B12).
const LEGACY_CACHE_PREFIXES = ["solado-v", "sezam-v"];
const ASSETS = [
  "./",
  "./index.html",
  "./prototype-solfege.html",
  "./manifest.json",
  "./data/music-watch.json",
  "./data/curriculum-v1.json",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && ((key.startsWith(CACHE_PREFIX)) || LEGACY_CACHE_NAMES.indexOf(key) >= 0 || LEGACY_CACHE_PREFIXES.some(p => key.startsWith(p)))).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Ne jamais intercepter le cross-origin (API GitHub de la synchro, etc.) : le cache ne doit voir que l'app.
  if (new URL(req.url).origin !== self.location.origin) return;
  const isDoc = req.mode === "navigate" || req.destination === "document";
  if (isDoc) {
    // Réseau d'abord : jamais une vieille version quand le réseau répond.
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            return caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {}).then(() => res);
          }
          return res;
        })
        .catch(() => caches.match(req).then(m => m || caches.match("./index.html")))
    );
    return;
  }
  // Autres ressources : cache immédiat, rafraîchissement silencieux en fond.
  const refresh = fetch(req).then(res => {
    if (!res || !res.ok) return res;
    const copy = res.clone();
    return caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {}).then(() => res);
  });
  event.waitUntil(refresh.then(() => {}).catch(() => {}));
  event.respondWith(caches.match(req).then(cached => cached || refresh).catch(() => refresh));
});
