import 'server-only';
import { db } from '@/lib/db';
import { todayInDushanbe } from '@/lib/format';
import { districtDistanceKm } from '@/lib/geo';
import { RIDE_SHARE_KM } from '@/lib/trips';

export type TripRow = {
  id: string;
  user_id: string;
  name: string;
  /** Телефон — только вошедшим пользователям (договориться о попутной загрузке) */
  phone: string | null;
  product_id: number;
  product_tj: string;
  product_ru: string;
  product_en: string;
  tons: number;
  from_district: string;
  market_id: number;
  trip_date: string;
};

/** Ближайшие рейсы на рынки (сегодня и позже). */
export async function getUpcomingTrips(viewerId: string | null): Promise<TripRow[]> {
  return db()<TripRow[]>`
    SELECT t.id::text AS id, t.user_id::text AS user_id, u.name,
           CASE WHEN ${viewerId !== null} THEN u.phone END AS phone,
           p.id AS product_id, p.name_tj AS product_tj, p.name_ru AS product_ru, p.name_en AS product_en,
           t.tons, t.from_district, t.market_id, t.trip_date
    FROM trips t JOIN users u ON u.id = t.user_id JOIN products p ON p.id = t.product_id
    WHERE t.trip_date >= ${todayInDushanbe()}::date AND NOT u.blocked
    ORDER BY t.trip_date, t.market_id, t.created_at
    LIMIT 200`;
}

/** Попутчики: рейсы в тот же день на тот же рынок с полей не дальше 30 км (кроме моего). */
export function fellowTrips(all: TripRow[], p: { date: string; marketId: number; from: string; userId: string | null }): TripRow[] {
  return all.filter((t) => {
    if (t.trip_date !== p.date || t.market_id !== p.marketId || t.user_id === p.userId) return false;
    const km = districtDistanceKm(t.from_district, p.from);
    return km !== null && km <= RIDE_SHARE_KM;
  });
}

/** Транспорт из объявления (кнопка «Рейс поле → рынок» на странице прицепа): цена за день и название. */
export async function getTransport(id: string): Promise<{ id: number; title: string; price: number; price_unit: string; district: string } | null> {
  if (!/^\d{1,9}$/.test(id)) return null;
  const [row] = await db()<{ id: number; title: string; price: number; price_unit: string; district: string }[]>`
    SELECT e.id, e.title, e.price, e.price_unit, e.district FROM equipment e JOIN users u ON u.id = e.owner_id
    WHERE e.id = ${id} AND e.active AND NOT e.hidden_by_admin AND NOT u.blocked AND 'transport' = ANY(e.works)`;
  return row ?? null;
}
