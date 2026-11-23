import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fieldErrors, loginSchema, registerSchema } from '@/lib/validation';
import { safeNext } from '@/lib/safe-next';

const ok = { phone: '90 123 45 67', password: '12345678', name: 'Рустам', district: 'khujand' };

test('registerSchema нормализует телефон', () => {
  const r = registerSchema.safeParse(ok);
  assert.ok(r.success);
  assert.equal(r.data.phone, '+992901234567');
});

test('registerSchema отклоняет короткий пароль', () => {
  const r = registerSchema.safeParse({ ...ok, password: '1234567' });
  assert.ok(!r.success);
  assert.equal(fieldErrors(r.error).password, 'err.passwordShort');
});

test('registerSchema отклоняет неверный телефон и район', () => {
  const r = registerSchema.safeParse({ ...ok, phone: 'abc', district: 'nowhere' });
  assert.ok(!r.success);
  const e = fieldErrors(r.error);
  assert.equal(e.phone, 'err.phoneInvalid');
  assert.equal(e.district, 'err.districtInvalid');
});

test('loginSchema требует пароль', () => {
  assert.equal(loginSchema.safeParse({ phone: '901234567', password: '' }).success, false);
});

test('safeNext пропускает локальные пути и блокирует внешние', () => {
  assert.equal(safeNext('/me/equipment'), '/me/equipment');
  assert.equal(safeNext('//evil.com'), '/me');
  assert.equal(safeNext('https://evil.com'), '/me');
  assert.equal(safeNext('/\\evil.com'), '/me');
  assert.equal(safeNext(null), '/me');
});
