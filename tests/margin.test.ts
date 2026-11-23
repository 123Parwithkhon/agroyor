import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareMarkets, parseAmount } from '@/lib/margin';

// Пример из ТЗ: 2 т лука в Исфаре (2,50 с.), в Худжанде 3,25 с.; прицеп 150 с. + топливо 250 с.
const prices = [
  { marketId: 1, price: 3.25 }, // Худжанд
  { marketId: 2, price: 3.0 }, // Истаравшан
  { marketId: 3, price: 2.5 }, // Исфара (дом)
];

test('compareMarkets: Худжанд выгоднее на 1 100 с. с одного рейса', () => {
  const rows = compareMarkets({ qty: 2000, homeMarketId: 3, prices, rent: 150, fuel: 250 });
  assert.equal(rows[0]?.marketId, 1);
  assert.equal(rows[0]?.revenue, 6500);
  assert.equal(rows[0]?.transport, 400);
  assert.equal(rows[0]?.net, 6100);
  assert.equal(rows[0]?.gain, 1100);
  const home = rows.find((r) => r.home);
  assert.equal(home?.net, 5000);
  assert.equal(home?.transport, 0);
  assert.equal(home?.gain, 0);
});

test('compareMarkets: при малом объёме выгоднее продать дома', () => {
  const rows = compareMarkets({ qty: 100, homeMarketId: 3, prices, rent: 150, fuel: 250 });
  assert.equal(rows[0]?.home, true);
  assert.ok((rows.find((r) => r.marketId === 1)?.gain ?? 0) < 0);
});

test('compareMarkets: рынок без цены пропускается, без цены дома — gain null', () => {
  const rows = compareMarkets({
    qty: 10, homeMarketId: 3, rent: 0, fuel: 0,
    prices: [{ marketId: 1, price: 2 }, { marketId: 3, price: null }],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.gain, null);
});

test('parseAmount: пробелы, запятая, мусор', () => {
  assert.equal(parseAmount('2 000'), 2000);
  assert.equal(parseAmount('2,5'), 2.5);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('-5'), null);
  assert.equal(parseAmount('abc'), null);
});
