// Service Worker to prevent cross-origin iframe redirects (frame-busting)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Intercept top-level navigation requests
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    // If the destination is a different origin, block it and return a 204 No Content response
    if (url.origin !== self.location.origin) {
      console.log('[SW] Intercepted and blocked top-level redirect to:', event.request.url);
      event.respondWith(new Response(null, { status: 204 }));
      return;
    }
  }
});
