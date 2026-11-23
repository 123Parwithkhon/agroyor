import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPhone, normalizePhone, whatsappLink } from '../lib/phone.ts';

test('normalizePhone принимает разные форматы ввода', () => {
  assert.equal(normalizePhone('+992 90 123 45 67'), '+992901234567');
  assert.equal(normalizePhone('992901234567'), '+992901234567');
  assert.equal(normalizePhone('90-123-45-67'), '+992901234567');
  assert.equal(normalizePhone('(90) 123 4567'), '+992901234567');
});

test('normalizePhone отклоняет неверные номера', () => {
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone('12345'), null);
  assert.equal(normalizePhone('+7 912 345 67 89'), null);
  assert.equal(normalizePhone('+992 90 123 45 678'), null);
});

test('formatPhone и whatsappLink', () => {
  assert.equal(formatPhone('+992901234567'), '+992 90 123 45 67');
  assert.equal(formatPhone('не номер'), 'не номер');
  assert.equal(whatsappLink('+992901234567'), 'https://wa.me/992901234567');
});
