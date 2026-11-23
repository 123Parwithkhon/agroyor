// Service worker AgroYor: работа при плохом интернете.
// - Страницы цен и техники: сначала сеть (с таймаутом), при неудаче — сохранённая копия.
// - Статика (_next/static, шрифты, иконки): из кэша, они не меняются (имена с хешем).
// - Личные страницы (/me, /admin, /reporter, вход) и API не кэшируются.
// При изменении логики увеличьте VERSION — старые кэши удалятся.
const VERSION = 'v1';
const PAGES = `agroyor-pages-${VERSION}`;
const STATIC = `agroyor-static-${VERSION}`;
const NETWORK_TIMEOUT_MS = 4000;

// Вкладки, которым страница отдана из кэша (сервер недоступен): страница спросит и покажет плашку.
// navigator.onLine тут не помогает — сеть у телефона есть, а сервер не отвечает.
const servedFromCache = new Set();

const CACHEABLE_PAGE = /^\/($|prices(\/|$)|equipment(\/|$))/;
const PRIVATE = /^\/(me|admin|reporter|login|register|api)(\/|$)/;

const OFFLINE_HTML = `<!doctype html><html lang="tg"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>AgroYor</title>
<body style="font-family:system-ui,sans-serif;background:#fcf8f0;color:#152657;padding:24px;text-align:center">
<h1>AgroYor</h1>
<p>Интернет нест. Вақте ки пайваст шавед, саҳифаро аз нав кушоед.</p>
<p>Нет интернета. Откройте страницу снова, когда появится связь.</p>
<p>No internet connection. Open the page again when you are back online.</p>
<p><a href="/" style="color:#0b7266">AgroYor</a></p></body></html>`;

self.addEventListener('install', (event) => {
  // Главная и цены — сразу в кэш, чтобы офлайн было что показать даже после первого визита
  event.waitUntil(
    caches.open(PAGES).then((c) => c.addAll(['/', '/prices']).catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('agroyor-') && ![PAGES, STATIC].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((r) => { clearTimeout(id); resolve(r); }, (e) => { clearTimeout(id); reject(e); });
  });
}

async function networkFirst(request, clientId) {
  const cache = await caches.open(PAGES);
  try {
    const response = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    // Кэшируем только успешные полные HTML-страницы
    if (response.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  } catch {
    if (clientId) servedFromCache.add(clientId);
    const cached = (await cache.match(request, { ignoreSearch: false })) ?? (await cache.match(request, { ignoreSearch: true }));
    if (cached) return cached;
    const home = await cache.match('/');
    if (home) return home;
    return new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVATE.test(url.pathname)) return;

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // Полная загрузка страницы (не RSC-запрос клиентского перехода)
  if (request.mode === 'navigate' && CACHEABLE_PAGE.test(url.pathname)) {
    event.respondWith(networkFirst(request, event.resultingClientId));
  }
});

// Страница спрашивает: «меня отдали из кэша?» — отвечаем через MessageChannel
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'agroyor:cached?' || !event.ports[0]) return;
  const id = event.source?.id;
  event.ports[0].postMessage(Boolean(id && servedFromCache.has(id)));
  if (id) servedFromCache.delete(id);
});
