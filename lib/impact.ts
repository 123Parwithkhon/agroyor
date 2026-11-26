// «Аналитика региона»: экономия фермеров и сокращение выбросов CO₂.
// Идея: без площадки технику чаще всего нанимают «где знают» — в среднем за BASELINE_KM;
// через AgroYor находят ближе (у соседей). Сэкономленный холостой пробег (туда и обратно) —
// меньше солярки, денег и CO₂. Все допущения — константы ниже и показаны на странице.

/** Средний путь до техники без площадки, км в одну сторону. */
export const BASELINE_KM = 35;
/** Расход трактора/комбайна на холостом перегоне, литров солярки на км. */
export const FUEL_L_PER_KM = 0.35;
/** Цена солярки, сомони за литр. */
export const DIESEL_TJS_PER_L = 11;
/** Выбросы при сгорании солярки, кг CO₂ на литр. */
export const CO2_KG_PER_L = 2.68;

export type ImpactBooking = {
  /** Расстояние от техники до поля (между центрами районов), км */
  distanceKm: number;
  /** Сколько хозяйств поехали одним рейсом (совместный заказ: организатор + соседи) */
  farms: number;
};

export type Impact = {
  bookings: number;
  farms: number;
  kmSaved: number;
  litersSaved: number;
  moneySaved: number;
  co2Kg: number;
};

/**
 * Экономия по броням: для каждого хозяйства холостой пробег был бы 2 × BASELINE_KM,
 * а через площадку на всю группу — 2 × фактическое расстояние (один выезд на всех).
 */
export function computeImpact(bookings: ImpactBooking[]): Impact {
  let km = 0;
  let farms = 0;
  for (const b of bookings) {
    const n = Math.max(1, b.farms);
    farms += n;
    const without = 2 * BASELINE_KM * n;
    const withPlatform = 2 * Math.max(0, b.distanceKm);
    km += Math.max(0, without - withPlatform);
  }
  const liters = km * FUEL_L_PER_KM;
  return {
    bookings: bookings.length,
    farms,
    kmSaved: Math.round(km),
    litersSaved: Math.round(liters),
    moneySaved: Math.round(liters * DIESEL_TJS_PER_L),
    co2Kg: Math.round(liters * CO2_KG_PER_L),
  };
}

export type Load = 'idle' | 'low' | 'normal' | 'high';

/** Загруженность техники района: доля занятых машино-дней за период. */
export function loadLevel(bookedDays: number, machines: number, periodDays: number): { percent: number; level: Load } {
  if (machines <= 0) return { percent: 0, level: 'idle' };
  const percent = Math.min(100, Math.round((bookedDays / (machines * periodDays)) * 100));
  const level: Load = percent === 0 ? 'idle' : percent < 15 ? 'low' : percent < 40 ? 'normal' : 'high';
  return { percent, level };
}

export type Gap = { district: string; type: string; demand: number; supply: number };

/**
 * Где не хватает техники: спрос (заявки фермеров района + «клич») при нехватке машин этого вида в районе.
 * Дефицит — спрос больше числа машин; самые острые — первыми.
 */
export function shortages(demand: Gap[]): Gap[] {
  return demand
    .filter((g) => g.demand > g.supply)
    .sort((a, b) => b.demand - b.supply - (a.demand - a.supply) || b.demand - a.demand);
}
