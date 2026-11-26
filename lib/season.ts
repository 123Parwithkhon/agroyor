// «Агро-календарь сезона» Согдийской области: шесть периодов по два месяца.
// Для каждого — главные работы, нужная техника (подсвечивается в каталоге)
// и сезонные продукты (подсвечиваются в таблице цен). Чистый модуль: для сервера, клиента и тестов.
import type { EquipmentType } from '@/lib/equipment';
import type { DictKey } from '@/lib/i18n';
import type { Work } from '@/lib/works';

export const SEASONS = ['winter', 'spring', 'early-summer', 'summer', 'autumn', 'late-autumn'] as const;
export type Season = (typeof SEASONS)[number];

export type SeasonInfo = {
  id: Season;
  /** Месяцы 1–12 */
  months: [number, number];
  works: Work[];
  types: EquipmentType[];
  /** Английские названия продуктов (как в сиде: products.name_en) — по ним ищем строки в таблице цен */
  products: string[];
};

export const SEASON_INFO: Record<Season, SeasonInfo> = {
  winter: { id: 'winter', months: [1, 2], works: ['transport'], types: ['trailer', 'tractor'], products: ['Potato', 'Onion', 'Dried apricots'] },
  spring: { id: 'spring', months: [3, 4], works: ['plowing', 'sowing'], types: ['tractor', 'cultivator', 'seeder', 'motoblock'], products: ['Carrot', 'Onion'] },
  'early-summer': { id: 'early-summer', months: [5, 6], works: ['spraying', 'irrigation', 'harvesting'], types: ['drone', 'sprayer', 'harvester', 'other'], products: ['Tomato', 'Carrot', 'Flour'] },
  summer: { id: 'summer', months: [7, 8], works: ['harvesting', 'irrigation', 'transport'], types: ['trailer', 'other', 'harvester'], products: ['Dried apricots', 'Tomato', 'Onion'] },
  autumn: { id: 'autumn', months: [9, 10], works: ['harvesting', 'transport'], types: ['harvester', 'trailer', 'tractor'], products: ['Apples', 'Potato', 'Carrot'] },
  'late-autumn': { id: 'late-autumn', months: [11, 12], works: ['plowing', 'transport'], types: ['tractor', 'cultivator', 'trailer'], products: ['Dried apricots', 'Apples', 'Potato'] },
};

export function isSeason(v: unknown): v is Season {
  return typeof v === 'string' && (SEASONS as readonly string[]).includes(v);
}

/** Период по дате 'YYYY-MM-DD' (обычно — сегодня в Душанбе). */
export function seasonOf(iso: string): Season {
  const month = Number(iso.slice(5, 7));
  return SEASONS.find((s) => month >= SEASON_INFO[s].months[0] && month <= SEASON_INFO[s].months[1]) ?? 'winter';
}

export function seasonTitleKey(s: Season): DictKey {
  return `season.${s}.title` as DictKey;
}

export function seasonTasksKey(s: Season): DictKey {
  return `season.${s}.tasks` as DictKey;
}

export function seasonMonthsKey(s: Season): DictKey {
  return `season.${s}.months` as DictKey;
}

/** Сезонный ли продукт: сравнение по английскому названию без учёта регистра. */
export function isSeasonalProduct(s: Season, nameEn: string): boolean {
  const n = nameEn.trim().toLowerCase();
  return n !== '' && SEASON_INFO[s].products.some((p) => p.toLowerCase() === n);
}
