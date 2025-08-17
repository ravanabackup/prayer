self.addEventListener("install", e => {
  e.waitUntil(caches.open("app-cache").then(c => c.addAll(["./", "index.html", "manifest.json", "icon.png"])));
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});

self.addEventListener("push", event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "New Video", {
      body: data.body || "Tap to open",
      icon: "icon.png"
    })
  );
});
