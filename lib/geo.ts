// Координаты для карты Согда. У объявлений нет точного адреса — только район,
// поэтому техника ставится у центра района (приблизительно) с небольшим разбросом.
import type { DistrictCode } from '@/lib/districts';

export type LatLng = [number, number];

/** Примерные центры городов и районов Согдийской области (широта, долгота). */
export const DISTRICT_CENTERS: Record<DistrictCode, LatLng> = {
  khujand: [40.283, 69.622],
  buston: [40.226, 69.695],
  guliston: [40.27, 69.82],
  istaravshan: [39.911, 69.006],
  istiqlol: [40.567, 69.65],
  isfara: [40.117, 70.625],
  konibodom: [40.283, 70.417],
  panjakent: [39.495, 67.61],
  ayni: [39.396, 68.537],
  asht: [40.667, 70.3],
  'b-gafurov': [40.217, 69.733],
  ghonchi: [39.97, 69.18],
  devashtich: [39.93, 69.3],
  'j-rasulov': [40.2, 69.55],
  zafarobod: [40.15, 68.83],
  'k-mastchoh': [39.35, 69.6],
  mastchoh: [40.25, 69.18],
  spitamen: [40.15, 69.37],
  shahriston: [39.77, 68.82],
};

/** Рынки по названию города (из БД: name_tj / name_ru / name_en). */
const MARKET_POINTS: { names: string[]; at: LatLng }[] = [
  { names: ['хуҷанд', 'худжанд', 'khujand'], at: [40.2843, 69.6313] },
  { names: ['истаравшан', 'istaravshan'], at: [39.9116, 69.004] },
  { names: ['исфара', 'isfara'], at: [40.124, 70.625] },
];

export function marketPoint(names: (string | null)[]): LatLng | null {
  const lower = names.filter(Boolean).map((n) => String(n).toLowerCase());
  return MARKET_POINTS.find((m) => m.names.some((n) => lower.some((l) => l.includes(n))))?.at ?? null;
}

/**
 * Детерминированный разброс вокруг центра района (по id объявления),
 * чтобы точки одного района не сливались в одну. До ~3 км.
 */
export function jitter([lat, lng]: LatLng, id: number): LatLng {
  const a = ((id * 137.508) % 360) * (Math.PI / 180);
  const r = 0.012 + ((id * 7) % 10) * 0.0025;
  return [lat + r * Math.sin(a), lng + r * Math.cos(a) * 1.3];
}

/** Радиус выезда по умолчанию, если владелец не указал (км). */
export const DEFAULT_RADIUS_KM = 20;
