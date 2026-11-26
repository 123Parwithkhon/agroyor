import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkNeedDate, checkResponse, demandSchema, isNearRequest } from '@/lib/demand';
import { fill } from '@/lib/fill';
import { districtDistanceKm, nearbyDistricts, nearestIndex } from '@/lib/geo';
import { DICTIONARIES } from '@/lib/i18n';
import { computeImpact, loadLevel, shortages } from '@/lib/impact';
import {
  buildPackage, CROPS, cropKey, machineHours, manualDays, packageTotals, parseHectares, rentCost, splitHours, STAGES, stageKey,
  type Candidate,
} from '@/lib/matcher';
import { isSeasonalProduct, SEASONS, seasonMonthsKey, seasonOf, seasonTasksKey, seasonTitleKey } from '@/lib/season';
import { calcTrip, fuelCost, parseTons } from '@/lib/trips';

const drone: Candidate = {
  id: 1, type: 'drone', title: 'Дрон DJI Agras T40', district: 'konibodom', price: 120, price_unit: 'hectare',
  with_operator: true, distanceKm: 0, radiusKm: 30,
};

test('подбор: дрон 2 га сада от вредителей — 240 с., 40 минут вместо 2 дней вручную', () => {
  const [pick] = buildPackage('orchard', 'protection', 2, [drone]);
  assert.ok(pick);
  assert.equal(pick.item?.id, 1);
  assert.deepEqual(pick.cost, { total: 240, qty: 2, unit: 'hectare' });
  assert.equal(Math.round(pick.hours * 60), 40);
  assert.equal(pick.manualDays, 2);
});

test('подбор: техника в радиусе выезда важнее дешёвой далёкой; нет техники — позиция пустая', () => {
  const far: Candidate = { ...drone, id: 2, price: 50, distanceKm: 80, radiusKm: 30 };
  const near: Candidate = { ...drone, id: 3, price: 150, distanceKm: 10, radiusKm: 30 };
  const [pick] = buildPackage('cotton', 'protection', 1, [far, near]);
  assert.equal(pick?.item?.id, 3);
  assert.equal(pick?.alternatives[0]?.id, 2);
  const picks = buildPackage('cotton', 'harvest', 2, []);
  assert.equal(picks.length, 2);
  assert.ok(picks.every((p) => p.item === null));
  assert.equal(packageTotals(picks).missing, 2);
});

test('подбор: прицеп считает рейсы по урожаю, оплата за час и за день', () => {
  assert.equal(machineHours('trailer', 'transport', 1, 'orchard'), 8); // 15 т → 4 рейса × 2 ч
  assert.deepEqual(rentCost(40, 'hour', 1, 2.2), { total: 100, qty: 2.5, unit: 'hour' });
  assert.deepEqual(rentCost(150, 'day', 1, 9), { total: 300, qty: 2, unit: 'day' });
  assert.equal(manualDays('transport', 3), null);
  assert.deepEqual(splitHours(2.5), { days: 0, hours: 2, minutes: 30 });
  assert.deepEqual(splitHours(20), { days: 3, hours: 0, minutes: 0 });
  assert.equal(parseHectares('2,5'), 2.5);
  assert.equal(parseHectares('0'), null);
  assert.equal(parseHectares('501'), null);
});

test('гео: расстояния между районами и ближайший рынок', () => {
  assert.equal(districtDistanceKm('khujand', 'khujand'), 0);
  const d = districtDistanceKm('konibodom', 'isfara');
  assert.ok(d !== null && d > 15 && d < 30, String(d));
  assert.equal(districtDistanceKm('khujand', 'nowhere'), null);
  assert.ok(nearbyDistricts('khujand', 30).includes('b-gafurov'));
  assert.ok(!nearbyDistricts('khujand', 30).includes('panjakent'));
  assert.equal(nearestIndex([40.12, 70.6], [null, [40.28, 69.63], [40.12, 70.62]]), 2);
});

test('клич: форма, дата, кто видит запрос и правила отклика', () => {
  const ok = demandSchema.safeParse({ type: 'harvester', district: 'spitamen', needDate: '2026-11-28', area: '4', budget: '350', note: '' });
  assert.ok(ok.success);
  assert.equal(ok.data.area, 4);
  assert.equal(ok.data.budget, 350);
  const bad = demandSchema.safeParse({ type: 'plane', district: 'x', needDate: '', area: '0', budget: 'abc' });
  assert.ok(!bad.success);

  assert.equal(checkNeedDate('2026-11-28', '2026-11-24'), null);
  assert.equal(checkNeedDate('2026-11-23', '2026-11-24'), 'err.datePast');
  assert.equal(checkNeedDate('2027-06-01', '2026-11-24'), 'err.dateTooFar');

  const req = { type: 'harvester', district: 'spitamen' };
  assert.equal(isNearRequest({ type: 'harvester', district: 'spitamen', service_radius_km: null }, req), true);
  assert.equal(isNearRequest({ type: 'tractor', district: 'spitamen', service_radius_km: null }, req), false);
  assert.equal(isNearRequest({ type: 'harvester', district: 'panjakent', service_radius_km: 20 }, req), false);
  assert.equal(isNearRequest({ type: 'harvester', district: 'panjakent', service_radius_km: 300 }, req), true);

  const base = { closed: false, needDate: '2026-11-28', today: '2026-11-24', authorId: '1', userId: '2', near: true, alreadyResponded: false };
  assert.equal(checkResponse(base), null);
  assert.equal(checkResponse({ ...base, closed: true }), 'err.requestClosed');
  assert.equal(checkResponse({ ...base, userId: '1' }), 'err.ownRequest');
  assert.equal(checkResponse({ ...base, near: false }), 'err.notNear');
  assert.equal(checkResponse({ ...base, alreadyResponded: true }), 'err.alreadyResponded');
});

test('аналитика: экономия пробега, загрузка и дефицит', () => {
  const impact = computeImpact([{ distanceKm: 0, farms: 1 }, { distanceKm: 10, farms: 3 }]);
  // 70 + (210 − 20) = 260 км холостого пробега
  assert.equal(impact.kmSaved, 260);
  assert.equal(impact.farms, 4);
  assert.equal(impact.litersSaved, 91);
  assert.equal(impact.moneySaved, 1001);
  assert.equal(impact.co2Kg, 244);
  assert.deepEqual(loadLevel(0, 2, 60), { percent: 0, level: 'idle' });
  assert.deepEqual(loadLevel(60, 2, 60), { percent: 50, level: 'high' });
  assert.equal(loadLevel(5, 0, 60).level, 'idle');
  const s = shortages([
    { district: 'isfara', type: 'harvester', demand: 3, supply: 0 },
    { district: 'khujand', type: 'tractor', demand: 1, supply: 2 },
    { district: 'spitamen', type: 'harvester', demand: 2, supply: 1 },
  ]);
  assert.deepEqual(s.map((g) => g.district), ['isfara', 'spitamen']);
});

test('рейс поле → рынок: выручка, доля рейса с попутчиками, выгода', () => {
  assert.equal(parseTons('3'), 3);
  assert.equal(parseTons('41'), null);
  assert.equal(fuelCost(0), 0);
  const solo = calcTrip({ tons: 3, priceA: 7, priceB: 8, rentPerDay: 150, distanceKm: 0, riders: 1, sameMarket: false });
  assert.equal(solo.kg, 3000);
  assert.equal(solo.revenueA, 21000);
  assert.equal(solo.revenueB, 24000);
  assert.equal(solo.tripCost, 150);
  assert.equal(solo.gain, 24000 - 150 - 21000);
  const shared = calcTrip({ tons: 3, priceA: 7, priceB: 8, rentPerDay: 150, distanceKm: 0, riders: 2, sameMarket: false });
  assert.equal(shared.myShare, 75);
  assert.equal(calcTrip({ tons: 1, priceA: 7, priceB: 7, rentPerDay: 150, distanceKm: 0, riders: 1, sameMarket: true }).gain, null);
});

test('агро-календарь: период по месяцу и сезонные продукты', () => {
  assert.equal(seasonOf('2026-11-24'), 'late-autumn');
  assert.equal(seasonOf('2026-01-10'), 'winter');
  assert.equal(seasonOf('2026-07-01'), 'summer');
  assert.ok(isSeasonalProduct('late-autumn', 'Dried apricots'));
  assert.ok(isSeasonalProduct('late-autumn', 'apples'));
  assert.ok(!isSeasonalProduct('late-autumn', 'Beef'));
  assert.ok(!isSeasonalProduct('late-autumn', ''));
});

test('динамические ключи словаря (сезоны, культуры, этапы) есть во всех языках', () => {
  const keys = [
    ...SEASONS.flatMap((s) => [seasonTitleKey(s), seasonTasksKey(s), seasonMonthsKey(s)]),
    ...CROPS.map(cropKey),
    ...STAGES.map(stageKey),
    ...['idle', 'low', 'normal', 'high'].map((l) => `an.level.${l}`),
  ];
  for (const [lang, dict] of Object.entries(DICTIONARIES)) {
    for (const k of keys) assert.ok(k in dict, `${lang}: нет ${k}`);
  }
});

test('fill подставляет значения', () => {
  assert.equal(fill('{a} аз {b}, {c}', { a: 1, b: 'два' }), '1 аз два, {c}');
});
