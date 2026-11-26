// «Цифровой маршрут урожая»: рейс с поля на рынок.
// Цена в точке А (ближайший к полю рынок) и в точке Б (куда везём), стоимость рейса
// и попутная загрузка: фермеры, которые в тот же день везут на тот же рынок, делят рейс.
import { FUEL_L_PER_KM, DIESEL_TJS_PER_L } from '@/lib/impact';

/** Сколько тонн можно указать в рейсе. */
export const TRIP_MAX_TONS = 40;
/** Попутчик — если его поле не дальше этого от моего (км между центрами районов). */
export const RIDE_SHARE_KM = 30;
/** Грузовик/трактор с прицепом: расход на км (туда с грузом, обратно пустым). */
export const TRUCK_FUEL_L_PER_KM = FUEL_L_PER_KM;

/** Тонны из формы: 0,1 … 40, запятая или точка. */
export function parseTons(raw: string | undefined): number | null {
  const s = (raw ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 0.1 && n <= TRIP_MAX_TONS ? n : null;
}

/** Топливо на рейс туда и обратно, сомони (дорога ≈ прямая × 1,3). */
export function fuelCost(distanceKm: number): number {
  const road = distanceKm * 1.3 * 2;
  return Math.round(road * TRUCK_FUEL_L_PER_KM * DIESEL_TJS_PER_L);
}

export type TripCalc = {
  kg: number;
  /** Выручка, если продать на рынке А (рядом с полем); null — там нет цены */
  revenueA: number | null;
  /** Выручка на рынке Б */
  revenueB: number | null;
  /** Аренда транспорта + топливо за весь рейс */
  tripCost: number;
  /** Моя доля рейса, если едем вместе с попутчиками (riders — сколько хозяйств, включая меня) */
  myShare: number;
  riders: number;
  /** Выгода поездки на Б против продажи на А, с учётом моей доли рейса; null — не с чем сравнить */
  gain: number | null;
};

/**
 * Рейс: tons тонн, цены за кг на рынках А и Б, аренда транспорта на день и расстояние поле → Б.
 * Если везти на ближайший же рынок (A = Б), сравнивать не с чем — выгода null.
 */
export function calcTrip(p: {
  tons: number;
  priceA: number | null;
  priceB: number | null;
  rentPerDay: number;
  distanceKm: number;
  riders: number;
  sameMarket: boolean;
}): TripCalc {
  const kg = Math.round(p.tons * 1000);
  const revenueA = p.priceA === null ? null : Math.round(kg * p.priceA);
  const revenueB = p.priceB === null ? null : Math.round(kg * p.priceB);
  const tripCost = Math.round(p.rentPerDay + fuelCost(p.distanceKm));
  const riders = Math.max(1, p.riders);
  const myShare = Math.round(tripCost / riders);
  const gain = p.sameMarket || revenueA === null || revenueB === null ? null : revenueB - myShare - revenueA;
  return { kg, revenueA, revenueB, tripCost, myShare, riders, gain };
}
