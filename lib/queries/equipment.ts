import 'server-only';
import { db } from '@/lib/db';
import type { EquipmentType, PriceUnit } from '@/lib/equipment';

export type EquipmentListItem = {
  id: number;
  type: EquipmentType;
  title: string;
  district: string;
  price: number;
  price_unit: PriceUnit;
  with_operator: boolean;
  photos: string[];
  owner_name: string;
  owner_rating: number | null;
  owner_reviews: number;
};

export type EquipmentDetails = EquipmentListItem & {
  description: string;
  owner_id: number;
  owner_phone: string;
};

export type Review = {
  id: number;
  rating: number;
  text: string;
  created_at: Date;
  author_name: string;
};

// Показываем только активные, не скрытые админом объявления незаблокированных владельцев.
// Рейтинг владельца считается запросом (не хранится), как требует ТЗ.
const VISIBLE = 'e.active AND NOT e.hidden_by_admin AND NOT u.blocked';

export async function listEquipment(limit: number): Promise<EquipmentListItem[]> {
  const sql = db();
  return sql<EquipmentListItem[]>`
    SELECT e.id, e.type, e.title, e.district, e.price, e.price_unit, e.with_operator, e.photos,
           u.name AS owner_name, r.avg AS owner_rating, coalesce(r.count, 0) AS owner_reviews
    FROM equipment e
    JOIN users u ON u.id = e.owner_id
    LEFT JOIN LATERAL (
      SELECT round(avg(rating), 1) AS avg, count(*)::int AS count
      FROM reviews WHERE target_user_id = u.id
    ) r ON true
    WHERE ${sql.unsafe(VISIBLE)}
    ORDER BY e.created_at DESC, e.id DESC
    LIMIT ${limit}`;
}

export async function getEquipment(id: number): Promise<EquipmentDetails | null> {
  const sql = db();
  const [row] = await sql<EquipmentDetails[]>`
    SELECT e.id, e.type, e.title, e.description, e.district, e.price, e.price_unit, e.with_operator,
           e.photos, e.owner_id, u.name AS owner_name, u.phone AS owner_phone,
           r.avg AS owner_rating, coalesce(r.count, 0) AS owner_reviews
    FROM equipment e
    JOIN users u ON u.id = e.owner_id
    LEFT JOIN LATERAL (
      SELECT round(avg(rating), 1) AS avg, count(*)::int AS count
      FROM reviews WHERE target_user_id = u.id
    ) r ON true
    WHERE e.id = ${id} AND ${sql.unsafe(VISIBLE)}`;
  return row ?? null;
}

/** Последние отзывы о пользователе (например, о владельце техники). */
export async function getUserReviews(userId: number, limit: number): Promise<Review[]> {
  return db()<Review[]>`
    SELECT rv.id, rv.rating, rv.text, rv.created_at, a.name AS author_name
    FROM reviews rv
    JOIN users a ON a.id = rv.author_id
    WHERE rv.target_user_id = ${userId}
    ORDER BY rv.created_at DESC
    LIMIT ${limit}`;
}
