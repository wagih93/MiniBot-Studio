const OFFLINE_CACHE_NAME = 'minibot-offline-v1';
const OFFLINE_CACHE_PREFIX = 'minibot-offline-';
const APP_SHELL_PATHS = ['/', '/index.html', '/css/app.css', '/js/app.js'];

function isSameOriginRequest(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function isHttpMethodRequest(requestUrl) {
  return requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:';
}

function canCacheRequest(request) {
  if (request.method !== 'GET') {
    return false;
  }

  const requestUrl = new URL(request.url);
  return isHttpMethodRequest(requestUrl) && isSameOriginRequest(requestUrl);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_PATHS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheKeys) => cacheKeys.filter((cacheKey) =>
        cacheKey.startsWith(OFFLINE_CACHE_PREFIX) && cacheKey !== OFFLINE_CACHE_NAME
      ))
      .then((staleCacheKeys) => Promise.all(staleCacheKeys.map((cacheKey) => caches.delete(cacheKey))))
      .then(() => self.clients.claim())
  );
});

async function fetchAndCacheResponse(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function resolveFromCacheOrNetwork(request) {
  const cache = await caches.open(OFFLINE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return fetchAndCacheResponse(request);
}

async function resolveNavigationFallback() {
  const cache = await caches.open(OFFLINE_CACHE_NAME);
  const cachedIndex = await cache.match('/index.html');
  if (cachedIndex) {
    return cachedIndex;
  }

  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

self.addEventListener('fetch', (event) => {
  if (!canCacheRequest(event.request)) {
    return;
  }

  event.respondWith(
    resolveFromCacheOrNetwork(event.request).catch(() => {
      if (event.request.mode === 'navigate') {
        return resolveNavigationFallback();
      }

      throw new Error(`Offline request failed: ${event.request.url}`);
    })
  );
});
