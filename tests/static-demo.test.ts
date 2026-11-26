import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ASSET_RE, queryDir, staticDemoScript } from '@/lib/static-demo';

test('queryDir: пустые параметры отбрасываются, ключи по алфавиту', () => {
  assert.equal(queryDir([]), '');
  assert.equal(queryDir([['type', '']]), '');
  assert.equal(queryDir([['type', 'tractor'], ['district', 'b-gafurov']]), 'q/district=b-gafurov__type=tractor');
  assert.equal(queryDir(new URLSearchParams('days=30')), 'q/days=30');
});

test('queryDir в браузерном скрипте совпадает с серверным', () => {
  const script = staticDemoScript('x');
  const src = script.match(/const queryDir = (\(params\) => \{[\s\S]*?\n {2}\});/)?.[1];
  assert.ok(src, 'в скрипте нет queryDir');
  const browserQueryDir = new Function(`return ${src}`)() as (p: Iterable<[string, string]>) => string;
  for (const q of ['', 'type=tractor', 'type=&district=isfara', 'crop=orchard&stage=protection&area=2&district=konibodom', 'a=%D0%BB%D1%83%D0%BA']) {
    const params = new URLSearchParams(q);
    assert.equal(browserQueryDir(params), queryDir(params), q);
  }
});

test('ASSET_RE: файлы не считаются страницами', () => {
  for (const p of ['/_next/static/x.js', '/demo-photos/t40.jpg', '/fonts/a.woff2', '/icon.svg', '/manifest.webmanifest']) {
    assert.ok(ASSET_RE.test(p), p);
  }
  for (const p of ['/', '/prices', '/equipment/match']) assert.ok(!ASSET_RE.test(p), p);
});
