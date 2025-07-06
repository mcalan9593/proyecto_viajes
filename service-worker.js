
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open("viajes-cache").then(function(cache) {
      return cache.addAll([
        "./",
        "./index.html",
        "./css/styles.css",
        "./js/script.js",
        "./manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
