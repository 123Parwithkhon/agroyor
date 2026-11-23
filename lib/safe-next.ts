// Адрес возврата после входа: только локальные пути, защита от редиректа на чужой сайт.
// Чистая функция без зависимостей — её используют и сервер, и тесты.
export function safeNext(next: string | null | undefined, fallback = '/me'): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    return next;
  }
  return fallback;
}
