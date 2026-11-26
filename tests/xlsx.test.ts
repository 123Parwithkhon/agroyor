import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inflateRawSync } from 'node:zlib';
import { buildXlsx, columnName, excelDate, sheetName, xmlEscape } from '@/lib/xlsx';

/** Читает ZIP по локальным заголовкам: имя файла → текст. */
function unzip(data: Uint8Array): Map<string, string> {
  const buf = Buffer.from(data);
  const out = new Map<string, string>();
  let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const size = buf.readUInt32LE(p + 18);
    const nameLen = buf.readUInt16LE(p + 26);
    const extra = buf.readUInt16LE(p + 28);
    const name = buf.subarray(p + 30, p + 30 + nameLen).toString('utf8');
    const start = p + 30 + nameLen + extra;
    out.set(name, inflateRawSync(buf.subarray(start, start + size)).toString('utf8'));
    p = start + size;
  }
  return out;
}

test('columnName и excelDate', () => {
  assert.equal(columnName(0), 'A');
  assert.equal(columnName(25), 'Z');
  assert.equal(columnName(26), 'AA');
  assert.equal(excelDate('1900-03-01'), 61);
  assert.equal(excelDate('2026-11-24'), 46350);
  assert.equal(excelDate('bad'), null);
});

test('xmlEscape и имя листа', () => {
  assert.equal(xmlEscape('a<b & "c"'), 'a&lt;b &amp; &quot;c&quot;');
  assert.equal(xmlEscape('x\u0001y'), 'xy');
  assert.equal(sheetName('Нархҳо [1]: 2026/11'), 'Нархҳо  1   2026 11');
});

test('xlsx: ZIP со всеми частями книги, шапка, дата, число и текст с формулой как текст', () => {
  const file = buildXlsx({
    name: 'Нархҳо',
    columns: [{ header: 'Сана' }, { header: 'Маҳсулот' }, { header: 'Нарх', money: true }],
    rows: [[{ date: '2026-11-24' }, '=SUM(A1)', 12.5], [{ date: '2026-11-25' }, 'Пиёз & Сабзӣ', null]],
  });
  assert.equal(Buffer.from(file).readUInt32LE(0), 0x04034b50);
  const files = unzip(file);
  assert.deepEqual(
    [...files.keys()].sort(),
    ['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml'],
  );
  const sheet = files.get('xl/worksheets/sheet1.xml') ?? '';
  assert.ok(sheet.includes('<t>Сана</t>'));
  assert.ok(sheet.includes('<c r="A2" s="2"><v>46350</v></c>'), 'дата — числом с форматом даты');
  assert.ok(sheet.includes('<c r="C2" s="3"><v>12.5</v></c>'), 'цена — числом');
  assert.ok(sheet.includes('<t xml:space="preserve">=SUM(A1)</t>'), 'формула — просто текст');
  assert.ok(!sheet.includes('<f>'));
  assert.ok(sheet.includes('Пиёз &amp; Сабзӣ'));
  assert.ok(!sheet.includes('r="C3"'), 'пустая ячейка не пишется');
  assert.ok(sheet.includes('<autoFilter ref="A1:C3"/>'));
  assert.ok(files.get('xl/workbook.xml')?.includes('name="Нархҳо"'));
});
