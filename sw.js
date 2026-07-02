/* Solado — service worker : app installable + hors-ligne.
   Stratégie :
   - documents HTML → réseau d'abord (on récupère toujours la dernière version quand on est en ligne),
     cache en secours (l'app reste utilisable hors-ligne) ;
   - autres ressources → cache d'abord, mise à jour en fond (stale-while-revalidate). */
const CACHE_NAME = "solado-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./prototype-solfege.html",
  "./manifest.json",
  "./icon.svg",
  "./icon-180.png"
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
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Ne jamais intercepter le cross-origin (API GitHub de la synchro, etc.) : le cache ne doit voir que l'app.
  if (!req.url.startsWith(self.location.origin)) return;
  const isDoc = req.mode === "navigate" || req.destination === "document";
  if (isDoc) {
    // Réseau d'abord : jamais une vieille version quand le réseau répond.
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then(m => m || caches.match("./index.html")))
    );
    return;
  }
  // Autres ressources : cache immédiat, rafraîchissement silencieux en fond.
  event.respondWith(
    caches.match(req).then(cached => {
      const refresh = fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || refresh;
    })
  );
});
