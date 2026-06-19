// FocusFlow AI — Service Worker
// Handles push notifications + offline caching

const CACHE_NAME = "focusflow-v1";
const STATIC_ASSETS = ["/", "/dashboard", "/manifest.json"];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Push — show notification
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = { title: "FocusFlow AI", body: "Time to focus!", icon: "/icon-192.png" };
  try { data = { ...data, ...JSON.parse(event.data.text()) }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon,
      badge:   "/icon-192.png",
      vibrate: [100, 50, 100],
      tag:     "focusflow",
      renotify: true,
      actions: [
        { action: "open",   title: "Open FocusFlow" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/focus") && "focus" in client) return client.focus();
        }
        return clients.openWindow("/focus");
      })
    );
  }
});

// Fetch — network-first, fall back to cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return; // Never cache API routes

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
