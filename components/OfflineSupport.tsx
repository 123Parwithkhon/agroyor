'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/** Спросить service worker, отдал ли он эту страницу из кэша (сервер был недоступен). */
function askServedFromCache(): Promise<boolean> {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return Promise.resolve(false);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), 2000);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data === true);
    };
    sw.postMessage({ type: 'agroyor:cached?' }, [channel.port2]);
  });
}

/**
 * Регистрирует service worker (только в продакшен-сборке: в dev он мешал бы горячей перезагрузке)
 * и показывает плашку, если интернета нет или страница открыта из сохранённой копии
 * (сеть есть, но сервер не ответил — частая ситуация на 3G).
 */
export function OfflineSupport({ text }: { text: string }) {
  // На сервере считаем, что сеть есть (плашки нет) — без расхождения при гидратации
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Без service worker сайт работает как обычно — ошибку не показываем
    });
    let alive = true;
    void askServedFromCache().then((cached) => {
      if (alive) setFromCache(cached);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (online && !fromCache) return null;
  return (
    <div role="status" className="sticky top-0 z-50 bg-zar-400 px-4 py-2 text-center text-sm font-semibold text-lapis-900">
      {text}
    </div>
  );
}
