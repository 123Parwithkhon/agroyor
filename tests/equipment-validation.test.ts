import assert from 'node:assert/strict';
import { test } from 'node:test';
import { equipmentSchema, fieldErrors } from '@/lib/validation';
import { EQUIPMENT_TYPES, PRICE_UNITS } from '@/lib/equipment';
import { DISTRICTS } from '@/lib/districts';

const ok = {
  type: EQUIPMENT_TYPES[0],
  title: 'Трактор МТЗ-82',
  description: '',
  district: DISTRICTS[0].code,
  price: '250',
  priceUnit: PRICE_UNITS[0],
  withOperator: true,
  photos: [] as string[],
};

test('equipmentSchema принимает корректные данные и цену с запятой', () => {
  assert.equal(equipmentSchema.safeParse(ok).success, true);
  const r = equipmentSchema.safeParse({ ...ok, price: '12,5' });
  assert.ok(r.success);
  assert.equal(r.data.price, 12.5);
});

test('equipmentSchema отклоняет цену вне диапазона и пустую', () => {
  for (const price of ['0', '-5', '100000', 'abc', '', '1.234']) {
    const r = equipmentSchema.safeParse({ ...ok, price });
    assert.ok(!r.success, price);
    assert.equal(fieldErrors(r.error).price, 'err.priceInvalid', price);
  }
});

test('equipmentSchema отклоняет неизвестный вид и единицу', () => {
  const r = equipmentSchema.safeParse({ ...ok, type: 'rocket', priceUnit: 'week' });
  assert.ok(!r.success);
  const e = fieldErrors(r.error);
  assert.equal(e.type, 'err.kindInvalid');
  assert.equal(e.priceUnit, 'err.unitInvalid');
});

test('equipmentSchema отклоняет чужие адреса фото и больше 5 фото', () => {
  assert.equal(equipmentSchema.safeParse({ ...ok, photos: ['https://evil.com/a.jpg'] }).success, false);
  assert.equal(equipmentSchema.safeParse({ ...ok, photos: ['/uploads/../.env'] }).success, false);
  assert.equal(equipmentSchema.safeParse({ ...ok, photos: Array(6).fill('/uploads/a.jpg') }).success, false);
  assert.equal(equipmentSchema.safeParse({ ...ok, photos: ['/uploads/a.jpg'] }).success, true);
});

test('equipmentSchema: виды работ и характеристики необязательны, мусор отсекается', async () => {
  const { equipmentSchema } = await import('@/lib/validation');
  const base = {
    type: 'tractor', title: 'Трактор МТЗ-82', description: '', district: 'khujand',
    price: '350', priceUnit: 'hectare', withOperator: true, photos: [],
  };
  const ok = equipmentSchema.parse({ ...base, works: ['plowing', 'hack'], workWidthM: '2,5', powerHp: '80', fuelLPerH: '', serviceRadiusKm: '30' });
  assert.deepEqual(ok.works, ['plowing']);
  assert.equal(ok.workWidthM, 2.5);
  assert.equal(ok.fuelLPerH, null);
  assert.equal(ok.powerHp, 80);
  assert.equal(ok.serviceRadiusKm, 30);
  const bad = equipmentSchema.safeParse({ ...base, powerHp: '80.5', serviceRadiusKm: '999' });
  assert.equal(bad.success, false);
});
