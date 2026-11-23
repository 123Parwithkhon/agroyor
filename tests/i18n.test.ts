import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DICTIONARIES, getDictionary, htmlLang, isLang, langFromCookieString, LANGS, localizedName } from '../lib/i18n.ts';
import { DISTRICTS } from '../lib/districts.ts';

test('язык из cookie, по умолчанию таджикский', () => {
  assert.equal(langFromCookieString(''), 'tj');
  assert.equal(langFromCookieString('lang=ru'), 'ru');
  assert.equal(langFromCookieString('lang=en'), 'en');
  assert.equal(langFromCookieString('a=1; lang=ru; b=2'), 'ru');
  assert.equal(langFromCookieString('lang=de'), 'tj');
  assert.equal(langFromCookieString('xlang=ru'), 'tj');
});

test('isLang и htmlLang', () => {
  assert.ok(isLang('tj') && isLang('ru') && isLang('en'));
  assert.ok(!isLang('de'));
  assert.ok(!isLang(undefined));
  assert.equal(htmlLang('tj'), 'tg');
  assert.equal(htmlLang('ru'), 'ru');
  assert.equal(htmlLang('en'), 'en');
});

test('во всех словарях одинаковые ключи и нет пустых строк', () => {
  const keys = Object.keys(DICTIONARIES.tj).sort();
  for (const lang of LANGS) {
    assert.deepEqual(Object.keys(DICTIONARIES[lang]).sort(), keys, `ключи словаря ${lang}`);
    for (const [key, value] of Object.entries(DICTIONARIES[lang])) {
      assert.ok(value.trim().length > 0, `${lang}.${key} пустой`);
    }
  }
});

// Признаки непереведённой строки: буквы, которых нет в алфавите языка
const NOT_TAJIK = /[ыщцьЫЩЦЬ]/;
const TAJIK_ONLY = /[ғӣқӯҳҷҒӢҚӮҲҶ]/;
const CYRILLIC = /[Ѐ-ӿ]/;

test('таджикский словарь без русских букв (ы, щ, ц, ь)', () => {
  for (const [key, value] of Object.entries(DICTIONARIES.tj)) {
    assert.ok(!NOT_TAJIK.test(value), `tj.${key}: «${value}» похоже на русский`);
  }
});

test('русский словарь без таджикских букв', () => {
  for (const [key, value] of Object.entries(DICTIONARIES.ru)) {
    assert.ok(!TAJIK_ONLY.test(value), `ru.${key}: «${value}» похоже на таджикский`);
  }
});

test('английский словарь без кириллицы', () => {
  for (const [key, value] of Object.entries(DICTIONARIES.en)) {
    assert.ok(!CYRILLIC.test(value), `en.${key}: «${value}» не переведён`);
  }
});

test('районы: все три названия заполнены, английские — латиницей', () => {
  for (const d of DISTRICTS) {
    assert.ok(d.tj && d.ru && d.en, d.code);
    assert.ok(!CYRILLIC.test(d.en), `${d.code}: ${d.en}`);
    assert.ok(!NOT_TAJIK.test(d.tj), `${d.code}: ${d.tj}`);
  }
});

test('localizedName: английский с запасным русским', () => {
  const p = { name_tj: 'Пиёз', name_ru: 'Лук', name_en: 'Onion' };
  assert.equal(localizedName(p, 'tj'), 'Пиёз');
  assert.equal(localizedName(p, 'ru'), 'Лук');
  assert.equal(localizedName(p, 'en'), 'Onion');
  assert.equal(localizedName({ ...p, name_en: '' }, 'en'), 'Лук');
});

test('getDictionary возвращает строки нужного языка', () => {
  assert.equal(getDictionary('en')('nav.prices'), 'Prices');
  assert.equal(getDictionary('ru')('nav.prices'), 'Цены');
  assert.equal(getDictionary('tj')('nav.prices'), 'Нархҳо');
});
