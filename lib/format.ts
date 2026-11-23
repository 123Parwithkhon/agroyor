// Форматирование денег и дат. Без Intl, чтобы вывод был одинаковым на сервере и в любом браузере.
// Тип языка описан здесь, а не импортирован из i18n, чтобы файл оставался без зависимостей
// (его импортирует сид, работающий вне Next).

type FormatLang = 'tj' | 'ru' | 'en';

const NBSP = ' ';
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function groupThousands(intPart: string, separator: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Сомони: tj/ru — «1 250 с.», «12,50 с.»; en — «1,250 TJS», «12.50 TJS».
 * Дробная часть показывается, только если она не нулевая.
 */
export function formatMoney(value: number, lang: FormatLang = 'tj'): string {
  const rounded = Math.round(value * 100) / 100;
  const [intPart = '0', frac] = Math.abs(rounded).toFixed(2).split('.');
  const sign = rounded < 0 ? '−' : '';
  const en = lang === 'en';
  const fraction = frac && frac !== '00' ? `${en ? '.' : ','}${frac}` : '';
  const grouped = groupThousands(intPart, en ? ',' : NBSP);
  return `${sign}${grouped}${fraction}${NBSP}${en ? 'TJS' : 'с.'}`;
}

/** Число без валюты (для таблиц, где валюта указана в заголовке): «1 250», «12,50» / en «1,250», «12.50». */
export function formatAmount(value: number, lang: FormatLang = 'tj'): string {
  return formatMoney(value, lang).replace(/ (с\.|TJS)$/, '');
}

/** '2026-12-03' → tj/ru '03.12.2026', en '3 Dec 2026' */
export function formatDate(iso: string, lang: FormatLang = 'tj'): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  if (lang === 'en') {
    const month = MONTHS_EN[Number(m) - 1];
    return month ? `${Number(d)}${NBSP}${month}${NBSP}${y}` : iso;
  }
  return `${d}.${m}.${y}`;
}

/** Сегодняшняя дата в Душанбе (UTC+5, без перехода на летнее время) в формате YYYY-MM-DD. */
export function todayInDushanbe(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}
