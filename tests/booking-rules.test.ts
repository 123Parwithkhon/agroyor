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

test('pickDate, rangeOverlaps, parseQty, rentalCost', async () => {
  const { pickDate, rangeOverlaps, parseQty, rentalCost } = await import('@/lib/booking-rules');
  assert.deepEqual(pickDate({ start: '', end: '' }, '2026-12-03'), { start: '2026-12-03', end: '' });
  assert.deepEqual(pickDate({ start: '2026-12-03', end: '' }, '2026-12-05'), { start: '2026-12-03', end: '2026-12-05' });
  assert.deepEqual(pickDate({ start: '2026-12-03', end: '' }, '2026-12-03'), { start: '2026-12-03', end: '2026-12-03' });
  assert.deepEqual(pickDate({ start: '2026-12-03', end: '' }, '2026-12-01'), { start: '2026-12-01', end: '' });
  assert.deepEqual(pickDate({ start: '2026-12-03', end: '2026-12-05' }, '2026-12-10'), { start: '2026-12-10', end: '' });
  const busy = [{ start_date: '2026-12-04', end_date: '2026-12-04' }];
  assert.equal(rangeOverlaps('2026-12-03', '2026-12-05', busy), true);
  assert.equal(rangeOverlaps('2026-12-05', '2026-12-06', busy), false);
  assert.equal(parseQty('3'), 3);
  assert.equal(parseQty('2,5'), 2.5);
  assert.equal(parseQty('0'), null);
  assert.equal(parseQty('abc'), null);
  assert.equal(rentalCost(3, 300), 900);
  assert.equal(rentalCost(2.5, 33.33), 83.33);
});
