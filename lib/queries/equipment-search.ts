import 'server-only';
import { db } from '@/lib/db';
import type { EquipmentType } from '@/lib/equipment';
import type { EquipmentListItem } from '@/lib/queries/equipment';
import type { Work } from '@/lib/works';

export const PAGE_SIZE = 12;

export type CatalogFilters = {
  type?: EquipmentType;
  /** Вид работ: фермер ищет по задаче («вспашка»), а не по модели трактора */
  work?: Work;
  district?: string;
  operator: boolean;
  sort: 'new' | 'cheap';
  page: number;
};

// Каталог: только активные, не скрытые админом объявления незаблокированных владельцев
export async function searchEquipment(f: CatalogFilters): Promise<{ items: EquipmentListItem[]; total: number }> {
  const sql = db();
  const where = sql`e.active AND NOT e.hidden_by_admin AND NOT u.blocked
    ${f.type ? sql`AND e.type = ${f.type}` : sql``}
    ${f.work ? sql`AND ${f.work} = ANY(e.works)` : sql``}
    ${f.district ? sql`AND e.district = ${f.district}` : sql``}
    ${f.operator ? sql`AND e.with_operator` : sql``}`;
  const order = f.sort === 'cheap' ? sql`e.price ASC, e.created_at DESC, e.id DESC` : sql`e.created_at DESC, e.id DESC`;

  const [{ n } = { n: 0 }] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM equipment e JOIN users u ON u.id = e.owner_id WHERE ${where}
  `;
  const items = await sql<EquipmentListItem[]>`
    SELECT e.id, e.type, e.title, e.district, e.price, e.price_unit, e.with_operator, e.photos,
           u.name AS owner_name, r.avg AS owner_rating, coalesce(r.count, 0) AS owner_reviews
    FROM equipment e
    JOIN users u ON u.id = e.owner_id
    LEFT JOIN LATERAL (
      SELECT round(avg(rating), 1) AS avg, count(*)::int AS count
      FROM reviews WHERE target_user_id = u.id
    ) r ON true
    WHERE ${where}
    ORDER BY ${order}
    LIMIT ${PAGE_SIZE} OFFSET ${(f.page - 1) * PAGE_SIZE}
  `;
  return { items, total: n };
}

export type MapItem = {
  id: number;
  type: EquipmentType;
  title: string;
  district: string;
  price: number;
  price_unit: 'day' | 'hour' | 'hectare';
  service_radius_km: number | null;
};

/** Техника для карты: те же фильтры, что в каталоге, без постраничного деления (до 300 точек). */
export async function searchEquipmentForMap(f: Omit<CatalogFilters, 'sort' | 'page'>): Promise<MapItem[]> {
  const sql = db();
  return sql<MapItem[]>`
    SELECT e.id, e.type, e.title, e.district, e.price, e.price_unit, e.service_radius_km
    FROM equipment e JOIN users u ON u.id = e.owner_id
    WHERE e.active AND NOT e.hidden_by_admin AND NOT u.blocked
      ${f.type ? sql`AND e.type = ${f.type}` : sql``}
      ${f.work ? sql`AND ${f.work} = ANY(e.works)` : sql``}
      ${f.district ? sql`AND e.district = ${f.district}` : sql``}
      ${f.operator ? sql`AND e.with_operator` : sql``}
    ORDER BY e.created_at DESC
    LIMIT 300
  `;
}

export type MatchItem = {
  id: number;
  type: EquipmentType;
  title: string;
  district: string;
  price: number;
  price_unit: 'day' | 'hour' | 'hectare';
  with_operator: boolean;
  service_radius_km: number | null;
  photo: string | null;
  owner_rating: number | null;
};

/** Кандидаты для «Подобрать комплекс»: вся доступная техника нужных видов (каталог небольшой). */
export async function listForMatching(types: EquipmentType[]): Promise<MatchItem[]> {
  if (types.length === 0) return [];
  return db()<MatchItem[]>`
    SELECT e.id, e.type, e.title, e.district, e.price, e.price_unit, e.with_operator, e.service_radius_km,
           e.photos[1] AS photo,
           (SELECT round(avg(rating), 1) FROM reviews WHERE target_user_id = u.id) AS owner_rating
    FROM equipment e JOIN users u ON u.id = e.owner_id
    WHERE e.active AND NOT e.hidden_by_admin AND NOT u.blocked AND e.type = ANY(${types}::equipment_type[])
    ORDER BY e.id
    LIMIT 500`;
}
