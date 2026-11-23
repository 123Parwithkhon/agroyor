import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkBookingDates, daysInclusive, isBooked, monthGrid } from '@/lib/booking-rules';

const today = '2026-11-22';

test('checkBookingDates: обычная бронь, ровно 30 дней и один день с сегодня', () => {
  assert.equal(checkBookingDates('2026-11-23', '2026-11-25', today), null);
  assert.equal(checkBookingDates('2026-12-01', '2026-12-30', today), null);
  assert.equal(checkBookingDates(today, today, today), null);
});

test('checkBookingDates: прошлое, перевёрнутые даты, мусор и больше 30 дней', () => {
  assert.equal(checkBookingDates('2026-11-21', '2026-11-23', today), 'err.datesPast');
  assert.equal(checkBookingDates('2026-11-25', '2026-11-23', today), 'err.datesInvalid');
  assert.equal(checkBookingDates('abc', '2026-11-23', today), 'err.datesInvalid');
  assert.equal(checkBookingDates('2026-02-30', '2026-03-02', today), 'err.datesInvalid');
  assert.equal(checkBookingDates('2026-12-01', '2026-12-31', today), 'err.datesTooLong');
});

test('daysInclusive и isBooked', () => {
  assert.equal(daysInclusive('2026-11-22', '2026-11-22'), 1);
  assert.equal(daysInclusive('2026-11-30', '2026-12-02'), 3);
  const r = [{ start_date: '2026-12-10', end_date: '2026-12-12' }];
  assert.equal(isBooked('2026-12-10', r), true);
  assert.equal(isBooked('2026-12-12', r), true);
  assert.equal(isBooked('2026-12-13', r), false);
});

test('monthGrid: ноябрь 2026 начинается с воскресенья', () => {
  const g = monthGrid(2026, 10);
  assert.ok(g.every((w) => w.length === 7));
  assert.ok(g[0]?.slice(0, 6).every((c) => c === null));
  assert.equal(g[0]?.[6], '2026-11-01');
  assert.equal(g.flat().filter(Boolean).length, 30);
});
