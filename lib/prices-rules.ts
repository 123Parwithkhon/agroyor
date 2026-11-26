import { daysInclusive } from '@/lib/booking-rules';


export type Named = { name_tj: string; name_ru: string; name_en: string | null };
export type PriceLang = 'tj' | 'ru' | 'en';

// Название на текущем языке; если перевода нет — запасной вариант
export function pickName(r: Named, lang: PriceLang): string {
  const own = lang === 'en' ? r.name_en : lang === 'ru' ? r.name_ru : r.name_tj;
  return own || r.name_ru || r.name_tj;
}

export type ParsedPrice = { ok: true; value: number } | { ok: false };

// Цена: > 0 и < 100 000, до двух знаков, запятая или точка
export function parsePrice(raw: string): ParsedPrice {
  const s = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return { ok: false };
  const value = Number(s);
  if (!(value > 0 && value < 100_000)) return { ok: false };
  return { ok: true, value };
}

export function isIsoDate(s: string | null | undefined): s is string {
  return !!s && daysInclusive(s, s) !== null;
}

export function shiftDate(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
