// Виды сельхозработ: фермеру проще искать технику по задаче, чем по модели трактора.
// Чистый модуль без зависимостей от сервера — используется в формах, каталоге и подсказках.
import type { EquipmentType } from '@/lib/equipment';
import type { DictKey } from '@/lib/i18n';

export const WORKS = ['plowing', 'sowing', 'spraying', 'harvesting', 'irrigation', 'transport'] as const;
export type Work = (typeof WORKS)[number];

/** Работы по умолчанию, если владелец ничего не отметил (та же таблица — в миграции 008). */
export const DEFAULT_WORKS: Record<EquipmentType, Work[]> = {
  tractor: ['plowing', 'sowing', 'transport'],
  cultivator: ['plowing'],
  seeder: ['sowing'],
  sprayer: ['spraying'],
  harvester: ['harvesting'],
  motoblock: ['plowing'],
  drone: ['spraying'],
  trailer: ['transport'],
  other: [],
};

export function isWork(v: unknown): v is Work {
  return typeof v === 'string' && (WORKS as readonly string[]).includes(v);
}

export function workKey(w: Work): DictKey {
  return `work.${w}`;
}

/** Отмеченные работы без повторов и мусора; пусто — работы по виду техники. */
export function resolveWorks(selected: readonly string[], type: EquipmentType): Work[] {
  const clean = WORKS.filter((w) => selected.includes(w));
  return clean.length > 0 ? clean : DEFAULT_WORKS[type];
}
