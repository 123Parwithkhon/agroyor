import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatAmount, formatDate, formatMoney, todayInDushanbe } from '../lib/format.ts';

const NBSP = ' ';

test('formatMoney tj/ru: пробелы между разрядами, запятая, «с.»', () => {
  assert.equal(formatMoney(1250), `1${NBSP}250${NBSP}с.`);
  assert.equal(formatMoney(1250, 'ru'), `1${NBSP}250${NBSP}с.`);
  assert.equal(formatMoney(12.5), `12,50${NBSP}с.`);
  assert.equal(formatMoney(0), `0${NBSP}с.`);
  assert.equal(formatMoney(1234567.891), `1${NBSP}234${NBSP}567,89${NBSP}с.`);
  assert.equal(formatMoney(999.999), `1${NBSP}000${NBSP}с.`);
});

test('formatMoney en: запятая между разрядами, точка, TJS', () => {
  assert.equal(formatMoney(1250, 'en'), `1,250${NBSP}TJS`);
  assert.equal(formatMoney(12.5, 'en'), `12.50${NBSP}TJS`);
  assert.equal(formatMoney(1234567.891, 'en'), `1,234,567.89${NBSP}TJS`);
});

test('formatAmount: без валюты, разделители по языку', () => {
  assert.equal(formatAmount(1250), `1${NBSP}250`);
  assert.equal(formatAmount(36.5, 'ru'), '36,50');
  assert.equal(formatAmount(36.5, 'en'), '36.50');
  assert.equal(formatAmount(1250, 'en'), '1,250');
});

test('formatDate', () => {
  assert.equal(formatDate('2026-12-03'), '03.12.2026');
  assert.equal(formatDate('2026-12-03', 'ru'), '03.12.2026');
  assert.equal(formatDate('2026-12-03', 'en'), `3${NBSP}Dec${NBSP}2026`);
});

test('todayInDushanbe: после 19:00 UTC в Душанбе уже следующий день', () => {
  assert.equal(todayInDushanbe(new Date('2026-12-02T18:59:00Z')), '2026-12-02');
  assert.equal(todayInDushanbe(new Date('2026-12-02T19:00:00Z')), '2026-12-03');
});
