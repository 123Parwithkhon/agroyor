// «Подобрать комплекс под моё поле»: культура + этап работ + площадь → какая техника нужна,
// сколько времени займёт работа машиной и сколько — вручную, и во что обойдётся.
// Чистые функции: страница /equipment/match, тесты. Нормы — средние для Согда, ориентир, а не обещание.
import type { EquipmentType, PriceUnit } from '@/lib/equipment';
import type { DictKey } from '@/lib/i18n';
import type { Work } from '@/lib/works';

export const CROPS = ['onion', 'potato', 'cotton', 'orchard'] as const;
export type Crop = (typeof CROPS)[number];

export const STAGES = ['prep', 'sowing', 'protection', 'harvest'] as const;
export type Stage = (typeof STAGES)[number];

/** Одна «позиция» комплекса: вид работ и подходящая техника в порядке предпочтения. */
export type Slot = { work: Work; types: EquipmentType[] };

const SLOTS: Record<Stage, Record<Crop, Slot[]>> = {
  prep: {
    onion: [{ work: 'plowing', types: ['tractor', 'motoblock'] }, { work: 'plowing', types: ['cultivator', 'motoblock'] }],
    potato: [{ work: 'plowing', types: ['tractor', 'motoblock'] }, { work: 'plowing', types: ['cultivator', 'motoblock'] }],
    cotton: [{ work: 'plowing', types: ['tractor'] }, { work: 'plowing', types: ['cultivator'] }],
    orchard: [{ work: 'plowing', types: ['motoblock', 'cultivator', 'tractor'] }],
  },
  sowing: {
    onion: [{ work: 'sowing', types: ['seeder', 'motoblock', 'tractor'] }],
    potato: [{ work: 'sowing', types: ['tractor', 'seeder', 'motoblock'] }],
    cotton: [{ work: 'sowing', types: ['seeder', 'tractor'] }],
    orchard: [{ work: 'sowing', types: ['motoblock', 'tractor'] }],
  },
  protection: {
    onion: [{ work: 'spraying', types: ['drone', 'sprayer'] }],
    potato: [{ work: 'spraying', types: ['drone', 'sprayer'] }],
    cotton: [{ work: 'spraying', types: ['drone', 'sprayer'] }],
    orchard: [{ work: 'spraying', types: ['drone', 'sprayer'] }],
  },
  harvest: {
    onion: [{ work: 'harvesting', types: ['tractor', 'harvester'] }, { work: 'transport', types: ['trailer', 'tractor'] }],
    potato: [{ work: 'harvesting', types: ['tractor', 'harvester'] }, { work: 'transport', types: ['trailer', 'tractor'] }],
    cotton: [{ work: 'harvesting', types: ['harvester'] }, { work: 'transport', types: ['trailer', 'tractor'] }],
    orchard: [{ work: 'transport', types: ['trailer', 'tractor'] }],
  },
};

export function slotsFor(crop: Crop, stage: Stage): Slot[] {
  return SLOTS[stage][crop];
}

/** Производительность машины, га в час (с заправками и переездами по полю). */
export const MACHINE_HA_PER_HOUR: Record<EquipmentType, number> = {
  drone: 3,
  sprayer: 1.5,
  tractor: 0.5,
  cultivator: 1.2,
  seeder: 1.5,
  harvester: 0.8,
  motoblock: 0.1,
  trailer: 0,
  other: 0.3,
};

/** Ручной труд: сколько гектаров один человек обработает за рабочий день. */
export const MANUAL_HA_PER_DAY: Record<Work, number | null> = {
  plowing: 0.05,
  sowing: 0.25,
  spraying: 1,
  harvesting: 0.1,
  irrigation: null,
  transport: null,
};

/** Урожай, тонн с гектара — для расчёта рейсов прицепа. */
export const YIELD_T_PER_HA: Record<Crop, number> = { onion: 40, potato: 25, cotton: 3, orchard: 15 };
/** Прицеп: тонн за рейс и часов на рейс (погрузка + дорога + выгрузка). */
export const TRAILER_T_PER_TRIP = 4;
export const TRAILER_HOURS_PER_TRIP = 2;
/** Рабочий день машины, часов (для оплаты посуточно). */
export const WORKDAY_HOURS = 8;

/** Часы работы машины на площади areaHa (округление вверх до 5 минут). */
export function machineHours(type: EquipmentType, work: Work, areaHa: number, crop: Crop): number {
  let hours: number;
  if (work === 'transport') {
    const trips = Math.max(1, Math.ceil((areaHa * YIELD_T_PER_HA[crop]) / TRAILER_T_PER_TRIP));
    hours = trips * TRAILER_HOURS_PER_TRIP;
  } else {
    const rate = MACHINE_HA_PER_HOUR[type] || 0.3;
    hours = areaHa / rate;
  }
  return Math.ceil(hours * 12) / 12;
}

/** Рейсы прицепа для вывоза урожая с площади. */
export function trailerTrips(areaHa: number, crop: Crop): number {
  return Math.max(1, Math.ceil((areaHa * YIELD_T_PER_HA[crop]) / TRAILER_T_PER_TRIP));
}

/** Человеко-дни вручную (null — вручную это не делают или нет нормы). */
export function manualDays(work: Work, areaHa: number): number | null {
  const rate = MANUAL_HA_PER_DAY[work];
  if (!rate) return null;
  return Math.ceil((areaHa / rate) * 2) / 2;
}

export type Cost = { total: number; qty: number; unit: PriceUnit };

/** Стоимость аренды: за гектар — × площадь, за час — × часы (вверх до получаса), за день — × рабочие дни. */
export function rentCost(price: number, unit: PriceUnit, areaHa: number, hours: number): Cost {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  if (unit === 'hectare') return { total: round2(price * areaHa), qty: areaHa, unit };
  if (unit === 'hour') {
    const qty = Math.max(1, Math.ceil(hours * 2) / 2);
    return { total: round2(price * qty), qty, unit };
  }
  const qty = Math.max(1, Math.ceil(hours / WORKDAY_HOURS));
  return { total: round2(price * qty), qty, unit };
}

export type Candidate = {
  id: number;
  type: EquipmentType;
  title: string;
  district: string;
  price: number;
  price_unit: PriceUnit;
  with_operator: boolean;
  /** Расстояние от поля (центр района), км */
  distanceKm: number;
  /** Радиус выезда владельца, км */
  radiusKm: number;
  /** Первое фото объявления (для карточки результата) */
  photo?: string | null;
};

export type Pick = {
  slot: Slot;
  item: Candidate | null;
  hours: number;
  manualDays: number | null;
  cost: Cost | null;
  /** Ещё варианты (для выбора), без лучшего */
  alternatives: Candidate[];
};

/**
 * Лучший вариант для позиции: сначала техника, которая сама выезжает к полю (в радиусе выезда),
 * затем — более предпочтительный вид, затем — дешевле итог, затем — ближе.
 */
export function pickForSlot(slot: Slot, candidates: Candidate[], areaHa: number, crop: Crop): Pick {
  const fitting = candidates.filter((c) => slot.types.includes(c.type));
  const scored = fitting
    .map((c) => {
      const hours = machineHours(c.type, slot.work, areaHa, crop);
      return { c, hours, cost: rentCost(c.price, c.price_unit, areaHa, hours) };
    })
    .sort(
      (a, b) =>
        Number(b.c.distanceKm <= b.c.radiusKm) - Number(a.c.distanceKm <= a.c.radiusKm) ||
        slot.types.indexOf(a.c.type) - slot.types.indexOf(b.c.type) ||
        a.cost.total - b.cost.total ||
        a.c.distanceKm - b.c.distanceKm,
    );
  const best = scored[0];
  const firstType = slot.types[0] ?? 'tractor';
  return {
    slot,
    item: best?.c ?? null,
    hours: best?.hours ?? machineHours(firstType, slot.work, areaHa, crop),
    manualDays: manualDays(slot.work, areaHa),
    cost: best?.cost ?? null,
    alternatives: scored.slice(1, 4).map((s) => s.c),
  };
}

/** Комплекс целиком: позиции по порядку; одна и та же машина не берётся дважды, если есть другая. */
export function buildPackage(crop: Crop, stage: Stage, areaHa: number, candidates: Candidate[]): Pick[] {
  const used = new Set<number>();
  return slotsFor(crop, stage).map((slot) => {
    const free = candidates.filter((c) => !used.has(c.id));
    const pick = pickForSlot(slot, free.length ? free : candidates, areaHa, crop);
    if (pick.item) used.add(pick.item.id);
    return pick;
  });
}

/** Итог комплекса: деньги, часы машин, человеко-дни вручную (по позициям, где есть норма). */
export function packageTotals(picks: Pick[]): { cost: number; hours: number; manualDays: number; missing: number } {
  let cost = 0;
  let hours = 0;
  let manual = 0;
  let missing = 0;
  for (const p of picks) {
    if (!p.item || !p.cost) {
      missing++;
      continue;
    }
    cost += p.cost.total;
    hours += p.hours;
    manual += p.manualDays ?? 0;
  }
  return { cost: Math.round(cost * 100) / 100, hours, manualDays: manual, missing };
}

/** Площадь из формы: 0,1 … 500 га, запятая или точка. */
export function parseHectares(raw: string | undefined): number | null {
  const s = (raw ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 0.1 && n <= 500 ? n : null;
}

export function isCrop(v: unknown): v is Crop {
  return typeof v === 'string' && (CROPS as readonly string[]).includes(v);
}

export function isStage(v: unknown): v is Stage {
  return typeof v === 'string' && (STAGES as readonly string[]).includes(v);
}

export function cropKey(c: Crop): DictKey {
  return `match.crop.${c}` as DictKey;
}

export function stageKey(s: Stage): DictKey {
  return `match.stage.${s}` as DictKey;
}

export type Duration = { days: number; hours: number; minutes: number };

/** Часы → дни (по 8 рабочих часов), часы и минуты — для подписи «40 мин», «2 ч 30 мин», «3 дн.». */
export function splitHours(total: number): Duration {
  const minutesAll = Math.round(total * 60);
  if (total >= WORKDAY_HOURS * 2) {
    return { days: Math.ceil(total / WORKDAY_HOURS), hours: 0, minutes: 0 };
  }
  return { days: 0, hours: Math.floor(minutesAll / 60), minutes: minutesAll % 60 };
}
