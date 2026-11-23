import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCsv, csvCell, parsePrice, pickName, shiftDate } from '@/lib/prices-rules';

test('parsePrice принимает нормальные цены', () => {
  assert.deepEqual(parsePrice('12'), { ok: true, value: 12 });
  assert.deepEqual(parsePrice('12,5'), { ok: true, value: 12.5 });
  assert.deepEqual(parsePrice('1 250'), { ok: true, value: 1250 });
  assert.deepEqual(parsePrice('99999.99'), { ok: true, value: 99999.99 });
});

test('parsePrice отклоняет мусор и значения вне диапазона', () => {
  for (const v of ['0', '-5', '100000', 'abc', '12.345', '', '1e3']) {
    assert.equal(parsePrice(v).ok, false, v);
  }
});

test('CSV начинается с BOM и экранирует запятые и кавычки', () => {
  const csv = buildCsv(['a', 'b'], [['x,y', 'say "hi"']]);
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes('"x,y","say ""hi"""'));
});

test('CSV нейтрализует формулы, но не трогает числа', () => {
  assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(csvCell(-5), '-5');
});

test('shiftDate сдвигает через границу месяца', () => {
  assert.equal(shiftDate('2026-12-01', -1), '2026-11-30');
  assert.equal(shiftDate('2026-11-30', 1), '2026-12-01');
});

test('pickName: английский с запасным русским', () => {
  const m = { name_tj: 'Хуҷанд', name_ru: 'Худжанд', name_en: '' };
  assert.equal(pickName(m, 'tj'), 'Хуҷанд');
  assert.equal(pickName(m, 'en'), 'Худжанд');
});
