import 'server-only';
import { db } from '@/lib/db';
import { todayInDushanbe } from '@/lib/format';
import type { DateRange } from '@/lib/booking-rules';

export type BookingRow = {
  id: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'done';
  start_date: string;
  end_date: string;
  comment: string;
  equipment_id: string;
  title: string;
  other_name: string;
  other_phone: string | null; // только у подтверждённой и завершённой брони
  reviewed: boolean; // я уже оставил отзыв
  is_new: boolean; // статус изменился, а я ещё не видел
  qty: number | null; // гектары или часы в заявке
  price_unit: 'day' | 'hour' | 'hectare';
  group_open: boolean;
  group_target_ha: number | null;
  group_joined_ha: number; // сколько гектаров добавили соседи
  group_members: number; // сколько соседей присоединилось
};

// Подтверждённые брони, закончившиеся в прошлом, становятся done
export async function refreshDoneBookings(): Promise<void> {
  await db()`
    UPDATE bookings SET status = 'done'
    WHERE status = 'confirmed' AND end_date < ${todayInDushanbe()}::date
  `;
}

export async function getBookedRanges(equipmentId: number): Promise<DateRange[]> {
  return db()<DateRange[]>`
    SELECT start_date, end_date FROM bookings
    WHERE equipment_id = ${equipmentId} AND status = 'confirmed'
      AND end_date >= ${todayInDushanbe()}::date
    ORDER BY start_date
  `;
}

// Мои брони как арендатора
export async function getMyBookings(userId: string): Promise<BookingRow[]> {
  return db()<BookingRow[]>`
    SELECT b.id::text AS id, b.status, b.start_date, b.end_date, b.note AS comment,
           b.equipment_id::text AS equipment_id, e.title, o.name AS other_name,
           CASE WHEN b.status IN ('confirmed', 'done') THEN o.phone END AS other_phone,
           EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id AND r.author_id = ${userId}) AS reviewed,
           NOT b.renter_seen AS is_new,
           b.qty, e.price_unit, b.group_open, b.group_target_ha,
           coalesce((SELECT sum(area_ha)::float8 FROM booking_joins j WHERE j.booking_id = b.id), 0) AS group_joined_ha,
           (SELECT count(*)::int FROM booking_joins j WHERE j.booking_id = b.id) AS group_members
    FROM bookings b
    JOIN equipment e ON e.id = b.equipment_id
    JOIN users o ON o.id = e.owner_id
    WHERE b.renter_id = ${userId}
    ORDER BY b.created_at DESC
    LIMIT 50
  `;
}

// Входящие заявки как владельца: ожидающие сверху
export async function getIncomingBookings(userId: string): Promise<BookingRow[]> {
  return db()<BookingRow[]>`
    SELECT b.id::text AS id, b.status, b.start_date, b.end_date, b.note AS comment,
           b.equipment_id::text AS equipment_id, e.title, u.name AS other_name,
           CASE WHEN b.status IN ('confirmed', 'done') THEN u.phone END AS other_phone,
           EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id AND r.author_id = ${userId}) AS reviewed,
           (b.status = 'pending' AND b.end_date >= ${todayInDushanbe()}::date) AS is_new,
           b.qty, e.price_unit, b.group_open, b.group_target_ha,
           coalesce((SELECT sum(area_ha)::float8 FROM booking_joins j WHERE j.booking_id = b.id), 0) AS group_joined_ha,
           (SELECT count(*)::int FROM booking_joins j WHERE j.booking_id = b.id) AS group_members
    FROM bookings b
    JOIN equipment e ON e.id = b.equipment_id
    JOIN users u ON u.id = b.renter_id
    WHERE e.owner_id = ${userId}
    ORDER BY (b.status = 'pending') DESC, b.created_at DESC
    LIMIT 50
  `;
}

// Для бейджа: ожидающие заявки к моей технике + изменения статусов моих броней
export async function getBadgeCount(userId: string): Promise<number> {
  try {
    const [row] = await db()<{ n: number }[]>`
      SELECT (
        (SELECT count(*) FROM bookings b JOIN equipment e ON e.id = b.equipment_id
          WHERE e.owner_id = ${userId} AND b.status = 'pending'
            AND b.end_date >= ${todayInDushanbe()}::date)
        +
        (SELECT count(*) FROM bookings WHERE renter_id = ${userId} AND NOT renter_seen)
      )::int AS n
    `;
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}

export async function markBookingsSeen(userId: string): Promise<void> {
  await db()`UPDATE bookings SET renter_seen = true WHERE renter_id = ${userId} AND NOT renter_seen`;
}

export type OpenGroup = {
  id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed';
  /** Район организатора — где собирается техника */
  district: string;
  organizer: string;
  renter_id: string;
  qty: number;
  target: number;
  joined: number[];
  /** Сколько гектаров добавил текущий пользователь (null — не участвует) */
  my_area: number | null;
};

/** Открытые сборы на технику (ожидают или подтверждены, ещё не закончились). */
export async function getOpenGroups(equipmentId: number, userId: string | null): Promise<OpenGroup[]> {
  return db()<OpenGroup[]>`
    SELECT b.id::text AS id, b.start_date, b.end_date, b.status, u.district, u.name AS organizer,
           b.renter_id::text AS renter_id, b.qty, b.group_target_ha AS target,
           coalesce(array_agg(j.area_ha::float8 ORDER BY j.created_at) FILTER (WHERE j.id IS NOT NULL), '{}'::float8[]) AS joined,
           max(j.area_ha) FILTER (WHERE j.user_id::text = ${userId ?? ''}) AS my_area
    FROM bookings b
    JOIN users u ON u.id = b.renter_id
    LEFT JOIN booking_joins j ON j.booking_id = b.id
    WHERE b.equipment_id = ${equipmentId} AND b.group_open
      AND b.status IN ('pending', 'confirmed') AND b.end_date >= ${todayInDushanbe()}::date
    GROUP BY b.id, u.district, u.name
    ORDER BY b.start_date
  `;
}
