// Статическая демо-версия для GitHub Pages (NEXT_PUBLIC_STATIC_DEMO=1, собирается scripts/export-static.mjs).
// GitHub Pages отдаёт только файлы: нет сервера, cookie-языка и query-параметров. Поэтому:
//  - язык — в пути: /agroyor/ (тоҷикӣ), /agroyor/ru/, /agroyor/en/;
//  - страница с параметрами (?type=tractor) сохраняется как /equipment/q/type=tractor/;
//  - действия, которым нужен сервер (вход, бронь, ввод цен), показывают «доступно в полной версии».

export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === '1';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Площади (га) в «Подборе комплекса» демо-версии — для них страницы сохранены заранее. */
export const STATIC_AREAS = ['1', '2', '5'] as const;

/**
 * Параметры запроса → папка: пустые значения отбрасываются, ключи сортируются.
 * '' — если параметров нет. Та же логика продублирована в STATIC_DEMO_SCRIPT (браузер)
 * и проверяется тестом tests/static-demo.test.ts.
 */
export function queryDir(params: Iterable<[string, string]>): string {
  const parts = [...params]
    .filter(([, v]) => v !== '')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? `q/${parts.join('__')}` : '';
}

/** Пути, которые не являются страницами (файлы) — их не переводим и не кодируем. */
export const ASSET_RE = /^\/(_next|demo-photos|fonts|icons|uploads)\/|^\/(icon\.svg|manifest\.webmanifest|robots\.txt|sw\.js)$/;

/**
 * Скрипт для браузера (встраивается в <body> только в демо-версии). Работает в фазе capture,
 * раньше обработчиков React/Next: переводит ссылки и GET-формы на статические адреса,
 * а отправку остальных форм (server actions) заменяет сообщением.
 */
export function staticDemoScript(blocked: string): string {
  return `(() => {
  const BASE = ${JSON.stringify(BASE_PATH)};
  const LANGS = ['ru', 'en'];
  const ASSET = ${ASSET_RE.toString()};
  const BLOCKED = ${JSON.stringify(blocked)};
  const split = (p) => {
    let rest = p.startsWith(BASE) ? p.slice(BASE.length) || '/' : p;
    const m = rest.match(/^\\/(ru|en)(\\/|$)/);
    const lang = m ? m[1] : '';
    if (m) rest = rest.slice(3) || '/';
    return { lang, rest };
  };
  const queryDir = (params) => {
    const parts = [...params]
      .filter(([, v]) => v !== '')
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v));
    return parts.length ? 'q/' + parts.join('__') : '';
  };
  const current = split(location.pathname).lang;
  const target = (url, lang) => {
    if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return null;
    const s = split(url.pathname);
    if (ASSET.test(s.rest)) return null;
    if (s.rest.startsWith('/api/')) return BASE + s.rest;
    let rest = s.rest;
    // Адрес уже со статической папкой /q/... (ссылка из сохранённой страницы) — оставляем как есть
    const q = /\\/q\\/[^/]*\\/?$/.test(rest) ? '' : queryDir(url.searchParams);
    if (q) rest = rest.replace(/\\/$/, '') + '/' + q;
    const l = lang ?? (s.lang || current);
    return BASE + (l ? '/' + l : '') + (rest === '/' && l ? '' : rest) + url.hash;
  };
  addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const url = new URL(href, location.href);
    // tel:, mailto:, WhatsApp и внешние сайты открываем как обычно
    if (url.origin !== location.origin) return;
    const lang = a.dataset.lang;
    const to = lang !== undefined
      ? target(new URL(BASE + split(location.pathname).rest, location.href), LANGS.includes(lang) ? lang : '')
      : target(url);
    if (!to) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    location.href = to;
  }, true);
  addEventListener('submit', (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if ((form.getAttribute('method') || 'get').toLowerCase() !== 'get' || form.querySelector('input[name^="$ACTION"]')) {
      alert(BLOCKED);
      return;
    }
    const url = new URL(form.getAttribute('action') || location.pathname, location.href);
    if (!form.getAttribute('action')) url.pathname = BASE + split(location.pathname).rest.replace(/\\/q\\/[^/]*\\/?$/, '');
    else if (!url.pathname.startsWith(BASE)) url.pathname = BASE + url.pathname;
    url.search = new URLSearchParams(new FormData(form)).toString();
    location.href = target(url) ?? url.href;
  }, true);
})();`;
}
