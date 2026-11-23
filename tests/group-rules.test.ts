import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkGroupRequest, checkJoin, groupProgress, parseArea, shareCost } from '@/lib/group-rules';

test('groupProgress: собрано 3 из 5 га — осталось 2', () => {
  const p = groupProgress(1, [1.5, 0.5], 5);
  assert.deepEqual(p, { collected: 3, target: 5, left: 2, percent: 60, reached: false });
});

test('groupProgress: цель достигнута и превышена', () => {
  assert.equal(groupProgress(3, [2], 5).reached, true);
  const over = groupProgress(4, [3], 5);
  assert.equal(over.percent, 100);
  assert.equal(over.left, 0);
});

test('shareCost и parseArea', () => {
  assert.equal(shareCost(0.5, 120), 60);
  assert.equal(parseArea('0,5'), 0.5);
  assert.equal(parseArea('0'), null);
  assert.equal(parseArea('101'), null);
  assert.equal(parseArea('abc'), null);
});

test('checkGroupRequest', () => {
  assert.equal(checkGroupRequest({ unit: 'hectare', open: false, qty: null, target: null }), null);
  assert.equal(checkGroupRequest({ unit: 'hectare', open: true, qty: 1, target: 5 }), null);
  assert.equal(checkGroupRequest({ unit: 'day', open: true, qty: 1, target: 5 }), 'err.groupHectareOnly');
  assert.equal(checkGroupRequest({ unit: 'hectare', open: true, qty: null, target: 5 }), 'err.qtyInvalid');
  assert.equal(checkGroupRequest({ unit: 'hectare', open: true, qty: 5, target: 5 }), 'err.groupTarget');
});

test('checkJoin: кто и когда может присоединиться', () => {
  const ok = {
    groupOpen: true, status: 'pending', endDate: '2026-12-05', today: '2026-11-23',
    userId: '8', renterId: '7', ownerId: '5', alreadyJoined: false,
  };
  assert.equal(checkJoin(ok), null);
  assert.equal(checkJoin({ ...ok, status: 'confirmed' }), null);
  assert.equal(checkJoin({ ...ok, groupOpen: false }), 'err.groupClosed');
  assert.equal(checkJoin({ ...ok, status: 'rejected' }), 'err.groupClosed');
  assert.equal(checkJoin({ ...ok, endDate: '2026-11-22' }), 'err.groupClosed');
  assert.equal(checkJoin({ ...ok, userId: '5' }), 'err.ownEquipment');
  assert.equal(checkJoin({ ...ok, userId: '7' }), 'err.groupAlready');
  assert.equal(checkJoin({ ...ok, alreadyJoined: true }), 'err.groupAlready');
});
