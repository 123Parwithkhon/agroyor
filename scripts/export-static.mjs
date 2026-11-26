// Статическая демо-копия для GitHub Pages: обходит запущенный сайт и сохраняет страницы в out/.
// Запуск (см. .github/workflows/deploy.yml): сборка с NEXT_PUBLIC_STATIC_DEMO=1 и NEXT_PUBLIC_BASE_PATH=/agroyor,
// затем `npm run start:local`, затем `node scripts/export-static.mjs`.
//
// Что делает:
//  - три языка: тоҷикӣ в /agroyor/, русский в /agroyor/ru/, английский в /agroyor/en/ (язык выбирается cookie);
//  - страница с параметрами (?type=tractor) → папка /equipment/q/type=tractor/ (lib/static-demo.ts, queryDir);
//  - ссылки, действия форм и пути к фото/шрифтам/иконкам получают префикс /agroyor;
//  - копирует .next/static и public/, добавляет 404.html и .nojekyll.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DISTRICTS } from '../lib/districts.ts';
import { EQUIPMENT_TYPES } from '../lib/equipment.ts';
import { CROPS, STAGES } from '../lib/matcher.ts';
import { ASSET_RE, queryDir, STATIC_AREAS } from '../lib/static-demo.ts';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const ORIGIN = process.env.EXPORT_ORIGIN ?? 'http://127.0.0.1:3000';
const OUT = path.resolve('out');
const LANGS = [
  { lang: 'tj', prefix: '' },
  { lang: 'ru', prefix: '/ru' },
  { lang: 'en', prefix: '/en' },
];
const CONCURRENCY = 4;
const MAX_PAGES_PER_LANG = 3000;
// Страницы, которым нужен вход: в демо их нет (ссылки ведут на /login)
const SKIP = /^\/(api\/auth|me|admin|reporter)(\/|$)/;

if (!BASE) throw new Error('Задайте NEXT_PUBLIC_BASE_PATH (например, /agroyor) — как при сборке');

// ---------- адреса ----------

/** '/equipment?type=tractor' → { rest: '/equipment', query: 'q/type=tractor' } */
function parse(href) {
  const url = new URL(href, `${ORIGIN}${BASE}/`);
  let rest = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) || '/' : url.pathname;
  if (rest.length > 1) rest = rest.replace(/\/$/, '');
  return { rest, search: url.search, hash: url.hash, query: queryDir(url.searchParams) };
}

/** Адрес страницы на GitHub Pages (без хоста). */
function staticHref({ rest, query, hash }, prefix) {
  if (ASSET_RE.test(rest)) return BASE + rest;
  if (rest.startsWith('/api/')) return BASE + rest; // файлы выгрузки — общие для всех языков, без параметров
  const p = rest === '/' ? '' : rest;
  const q = query ? `/${query}` : '';
  return `${BASE}${prefix}${p}${q}/${hash}`;
}

/** Куда сохранить ответ. */
function outFile({ rest, query }, prefix) {
  if (rest.startsWith('/api/')) return path.join(OUT, rest);
  const p = rest === '/' ? '' : rest;
  return path.join(OUT, prefix, p, query, 'index.html');
}

const key = (p) => p.rest + (p.query ? `|${p.query}` : '');

// ---------- переписывание HTML ----------

const ESC = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PUBLIC_RE = new RegExp(`(["'(\\s=])/(demo-photos|fonts|icons|uploads)/`, 'g');

function rewriteHtml(html, page, prefix) {
  // 1. Пути к файлам из public/ (и в атрибутах, и в данных React) — с префиксом /agroyor
  let out = html.replace(PUBLIC_RE, `$1${BASE}/$2/`);
  // 2. Переключатель языка: ссылка на эту же страницу на другом языке
  out = out.replace(/href="[^"]*"( data-lang="(tj|ru|en)")/g, (_, attr, lang) => {
    const target = LANGS.find((l) => l.lang === lang);
    return `href="${staticHref(page, target.prefix)}"${attr}`;
  });
  // 3. Ссылки и действия форм внутри сайта
  out = out.replace(/(href|action)="(\/[^"/][^"]*|\/)"(?! data-lang)/g, (m, attr, raw) => {
    const value = raw.replaceAll('&amp;', '&');
    const p = parse(value.startsWith(BASE) ? value : BASE + value);
    if (attr === 'action') return `action="${BASE}${p.rest === '/' ? '/' : p.rest}"`;
    return `href="${staticHref(p, prefix).replaceAll('&', '&amp;')}"`;
  });
  return out;
}

/** Ссылки со страницы — для обхода (до переписывания). */
function links(html) {
  const found = [];
  for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
    const value = m[1].replaceAll('&amp;', '&');
    if (value.startsWith('//')) continue;
    const p = parse(value.startsWith(BASE) ? value : BASE + value);
    if (ASSET_RE.test(p.rest) || SKIP.test(p.rest)) continue;
    if (p.rest.startsWith('/api/')) found.push({ ...p, query: '', search: '' });
    else found.push(p);
  }
  return found;
}

// ---------- обход ----------

function seeds() {
  const list = ['/', '/equipment', '/equipment?view=map', '/prices', '/requests', '/trips', '/analytics',
    '/equipment/match', '/login', '/register', '/api/prices.xlsx', '/api/prices.csv'];
  // Форма поиска на главной: вид техники × район
  for (const type of ['', ...EQUIPMENT_TYPES]) {
    for (const d of ['', ...DISTRICTS.map((x) => x.code)]) {
      list.push(`/equipment?${new URLSearchParams({ type, district: d })}`);
    }
  }
  // «Подбор комплекса»: культура × этап × площадь × район
  for (const crop of CROPS) for (const stage of STAGES) for (const area of STATIC_AREAS) {
    for (const d of DISTRICTS) list.push(`/equipment/match?${new URLSearchParams({ crop, stage, area, district: d.code })}`);
  }
  return list.map((s) => parse(BASE + s));
}

async function save(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
}

const redirectStub = (to) =>
  `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${to}"><link rel="canonical" href="${to}"><a href="${to}">${to}</a>`;

async function crawlLang({ lang, prefix }) {
  const headers = { cookie: `lang=${lang}` };
  const queue = seeds();
  const seen = new Set(queue.map(key));
  let saved = 0;
  let missing = 0;

  async function visit(page) {
    // Главная — без косой черты в конце: /agroyor/ Next перенаправляет на /agroyor
    const url = `${ORIGIN}${BASE}${page.rest === '/' ? '' : page.rest}${page.search}`;
    let res = await fetch(url, { headers, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const to = parse(res.headers.get('location') ?? '/');
      // Перенаправление на ту же страницу (например, косая черта) — просто следуем за ним
      if (key(to) !== key(page)) {
        await save(outFile(page, prefix), redirectStub(staticHref(to, prefix)));
        return;
      }
      res = await fetch(url, { headers });
    }
    if (!res.ok) {
      missing++;
      return;
    }
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('text/html')) {
      if (!prefix) await save(outFile(page, prefix), Buffer.from(await res.arrayBuffer()));
      return;
    }
    const html = await res.text();
    for (const next of links(html)) {
      const k = key(next);
      if (!seen.has(k) && seen.size < MAX_PAGES_PER_LANG) {
        seen.add(k);
        queue.push(next);
      }
    }
    await save(outFile(page, prefix), rewriteHtml(html, page, prefix));
    saved++;
  }

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const page = queue.shift();
      try {
        await visit(page);
      } catch (err) {
        console.warn(`⚠ ${page.rest}${page.search}: ${err.message}`);
        missing++;
      }
    }
  });
  await Promise.all(workers);
  console.log(`✔ ${lang}: ${saved} страниц${missing ? `, пропущено ${missing}` : ''}`);
}

// ---------- файлы ----------

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function copyAssets() {
  cpSync('.next/static', path.join(OUT, '_next/static'), { recursive: true });
  for (const name of readdirSync('public')) {
    if (name === 'sw.js') continue; // service worker в демо не нужен
    cpSync(path.join('public', name), path.join(OUT, name), { recursive: true });
  }
  // url(/fonts/...) в CSS — тоже с префиксом
  for (const file of walk(path.join(OUT, '_next/static')).filter((f) => f.endsWith('.css'))) {
    const css = readFileSync(file, 'utf8');
    const fixed = css.replace(/url\((["']?)\/(fonts|icons|demo-photos)\//g, `url($1${BASE}/$2/`);
    if (fixed !== css) writeFileSync(file, fixed);
  }
  // Иконка, манифест и robots.txt — служебные маршруты Next
  for (const name of ['icon.svg', 'manifest.webmanifest', 'robots.txt']) {
    const res = await fetch(`${ORIGIN}${BASE}/${name}`);
    if (!res.ok) continue;
    let body = await res.text();
    if (name === 'manifest.webmanifest') {
      body = body.replace(new RegExp(`"/(?!${ESC(BASE.slice(1))})`, 'g'), `"${BASE}/`);
    }
    writeFileSync(path.join(OUT, name), body);
  }
  // 404.html: GitHub Pages показывает её для любого несохранённого адреса
  const res = await fetch(`${ORIGIN}${BASE}/__missing__`);
  writeFileSync(path.join(OUT, '404.html'), rewriteHtml(await res.text(), parse(`${BASE}/`), ''));
  writeFileSync(path.join(OUT, '.nojekyll'), '');
}

// ---------- запуск ----------

const health = await fetch(`${ORIGIN}${BASE}/api/health`).catch(() => null);
if (!health?.ok) throw new Error(`Сайт не отвечает на ${ORIGIN}${BASE}/api/health — запустите npm run start:local`);
if (!existsSync('.next/static')) throw new Error('Нет .next/static — сначала npm run build');

rmSync(OUT, { recursive: true, force: true });
for (const l of LANGS) await crawlLang(l);
await copyAssets();
console.log(`Готово: ${OUT}`);
