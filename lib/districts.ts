// Города и районы Согдийской области. В БД хранится код (slug), название — из этого списка.
// Английские названия — в официальной латинской транслитерации Таджикистана.
import type { Lang } from '@/lib/i18n';

export const DISTRICTS = [
  { code: 'khujand', tj: 'Хуҷанд', ru: 'Худжанд', en: 'Khujand' },
  { code: 'buston', tj: 'Бӯстон', ru: 'Бустон', en: 'Buston' },
  { code: 'guliston', tj: 'Гулистон', ru: 'Гулистон', en: 'Guliston' },
  { code: 'istaravshan', tj: 'Истаравшан', ru: 'Истаравшан', en: 'Istaravshan' },
  { code: 'istiqlol', tj: 'Истиқлол', ru: 'Истиклол', en: 'Istiqlol' },
  { code: 'isfara', tj: 'Исфара', ru: 'Исфара', en: 'Isfara' },
  { code: 'konibodom', tj: 'Конибодом', ru: 'Канибадам', en: 'Konibodom' },
  { code: 'panjakent', tj: 'Панҷакент', ru: 'Пенджикент', en: 'Panjakent' },
  { code: 'ayni', tj: 'Айнӣ', ru: 'Айни', en: 'Ayni' },
  { code: 'asht', tj: 'Ашт', ru: 'Ашт', en: 'Asht' },
  { code: 'b-gafurov', tj: 'Бобоҷон Ғафуров', ru: 'Бободжон Гафуров', en: 'Bobojon Ghafurov' },
  { code: 'ghonchi', tj: 'Ғончӣ', ru: 'Ганчи', en: 'Ghonchi' },
  { code: 'devashtich', tj: 'Деваштич', ru: 'Деваштич', en: 'Devashtich' },
  { code: 'j-rasulov', tj: 'Ҷаббор Расулов', ru: 'Джаббор Расулов', en: 'Jabbor Rasulov' },
  { code: 'zafarobod', tj: 'Зафаробод', ru: 'Зафарабад', en: 'Zafarobod' },
  { code: 'k-mastchoh', tj: 'Кӯҳистони Мастчоҳ', ru: 'Кухистони Мастчох', en: 'Kuhistoni Mastchoh' },
  { code: 'mastchoh', tj: 'Мастчоҳ', ru: 'Мастчох', en: 'Mastchoh' },
  { code: 'spitamen', tj: 'Спитамен', ru: 'Спитамен', en: 'Spitamen' },
  { code: 'shahriston', tj: 'Шаҳристон', ru: 'Шахристан', en: 'Shahriston' },
] as const;

export type DistrictCode = (typeof DISTRICTS)[number]['code'];

export const DISTRICT_CODES = DISTRICTS.map((d) => d.code) as [DistrictCode, ...DistrictCode[]];

export function districtName(code: string, lang: Lang): string {
  return DISTRICTS.find((d) => d.code === code)?.[lang] ?? code;
}
