import 'server-only';
import { db } from '@/lib/db';
import { isNearRequest } from '@/lib/demand';
import type { EquipmentType, PriceUnit } from '@/lib/equipment';
import { todayInDushanbe } from '@/lib/format';

export type DemandRequest = {
  id: string;
  user_id: string;
  author: string;
  type: EquipmentType;
  district: string;
  need_date: string;
  area_ha: number;
  budget_per_ha: number | null;
  note: string;
  created_at: Date;
  responses: number;
};

/** Открытые запросы на сегодня и позже (новые сверху). */
export async function getOpenRequests(f: { type?: EquipmentType; district?: string } = {}): Promise<DemandRequest[]> {
  const sql = db();
  return sql<DemandRequest[]>`
    SELECT r.id::text AS id, r.user_id::text AS user_id, u.name AS author, r.type, r.district, r.need_date,
           r.area_ha, r.budget_per_ha, r.note, r.created_at,
           (SELECT count(*)::int FROM demand_responses x WHERE x.request_id = r.id) AS responses
    FROM demand_requests r JOIN users u ON u.id = r.user_id
    WHERE NOT r.closed AND NOT u.blocked AND r.need_date >= ${todayInDushanbe()}::date
      ${f.type ? sql`AND r.type = ${f.type}` : sql``}
      ${f.district ? sql`AND r.district = ${f.district}` : sql``}
    ORDER BY r.created_at DESC
    LIMIT 100`;
}

export type OwnerEquipment = {
  id: string;
  type: EquipmentType;
  title: string;
  district: string;
  price: number;
  price_unit: PriceUnit;
  service_radius_km: number | null;
};

/** Активная техника владельца — для откликов на запросы. */
export async function getOwnerEquipment(userId: string): Promise<OwnerEquipment[]> {
  return db()<OwnerEquipment[]>`
    SELECT id::text AS id, type, title, district, price, price_unit, service_radius_km
    FROM equipment WHERE owner_id = ${userId} AND active AND NOT hidden_by_admin
    ORDER BY created_at DESC`;
}

export type NearbyRequest = DemandRequest & {
  /** Моя техника, которой можно откликнуться, и откликнулся ли я ею */
  options: { equipment: OwnerEquipment; responded: boolean }[];
  is_new: boolean;
};

/** Запросы рядом с техникой владельца (тот же вид, до 30 км или в радиусе выезда). */
export async function getNearbyRequests(userId: string): Promise<NearbyRequest[]> {
  const equipment = await getOwnerEquipment(userId);
  if (equipment.length === 0) return [];
  const types = [...new Set(equipment.map((e) => e.type))];
  const sql = db();
  const [seen] = await sql<{ at: Date }[]>`SELECT requests_seen_at AS at FROM users WHERE id = ${userId}`;
  const open = await sql<(DemandRequest & { responded_ids: string[] })[]>`
    SELECT r.id::text AS id, r.user_id::text AS user_id, u.name AS author, r.type, r.district, r.need_date,
           r.area_ha, r.budget_per_ha, r.note, r.created_at,
           (SELECT count(*)::int FROM demand_responses x WHERE x.request_id = r.id) AS responses,
           coalesce((SELECT array_agg(x.equipment_id::text) FROM demand_responses x
                     WHERE x.request_id = r.id AND x.owner_id = ${userId}), '{}') AS responded_ids
    FROM demand_requests r JOIN users u ON u.id = r.user_id
    WHERE NOT r.closed AND NOT u.blocked AND r.need_date >= ${todayInDushanbe()}::date
      AND r.user_id <> ${userId} AND r.type = ANY(${types}::equipment_type[])
    ORDER BY r.need_date, r.created_at DESC
    LIMIT 200`;
  const out: NearbyRequest[] = [];
  for (const { responded_ids, ...r } of open) {
    const options = equipment
      .filter((e) => isNearRequest(e, r))
      .map((e) => ({ equipment: e, responded: responded_ids.includes(e.id) }));
    if (options.length === 0) continue;
    out.push({ ...r, options, is_new: !!seen && r.created_at > seen.at && !options.some((o) => o.responded) });
  }
  return out;
}

export type MyRequest = DemandRequest & {
  closed: boolean;
  offers: {
    equipment_id: string;
    title: string;
    type: EquipmentType;
    district: string;
    price: number;
    price_unit: PriceUnit;
    owner: string;
    phone: string;
    created_at: Date;
    is_new: boolean;
  }[];
};

/** Мои запросы с откликами владельцев (телефон владельца виден автору запроса). */
export async function getMyRequests(userId: string): Promise<MyRequest[]> {
  const sql = db();
  const rows = await sql<(DemandRequest & { closed: boolean; author_seen_at: Date })[]>`
    SELECT r.id::text AS id, r.user_id::text AS user_id, '' AS author, r.type, r.district, r.need_date,
           r.area_ha, r.budget_per_ha, r.note, r.created_at, r.closed, r.author_seen_at,
           (SELECT count(*)::int FROM demand_responses x WHERE x.request_id = r.id) AS responses
    FROM demand_requests r
    WHERE r.user_id = ${userId}
    ORDER BY r.closed, r.created_at DESC
    LIMIT 30`;
  if (rows.length === 0) return [];
  const offers = await sql<(MyRequest['offers'][number] & { request_id: string })[]>`
    SELECT x.request_id::text AS request_id, e.id::text AS equipment_id, e.title, e.type, e.district, e.price, e.price_unit,
           u.name AS owner, u.phone, x.created_at, false AS is_new
    FROM demand_responses x
    JOIN equipment e ON e.id = x.equipment_id
    JOIN users u ON u.id = x.owner_id
    WHERE x.request_id = ANY(${rows.map((r) => Number(r.id))}::int[]) AND NOT u.blocked
    ORDER BY e.price`;
  return rows.map(({ author_seen_at, ...r }) => ({
    ...r,
    offers: offers
      .filter((o) => o.request_id === r.id)
      .map((o) => ({
        equipment_id: o.equipment_id, title: o.title, type: o.type, district: o.district, price: o.price,
        price_unit: o.price_unit, owner: o.owner, phone: o.phone, created_at: o.created_at,
        is_new: o.created_at > author_seen_at,
      })),
  }));
}

/** Для бейджа: новые запросы рядом с моей техникой + новые отклики на мои запросы. */
export async function getDemandBadge(userId: string): Promise<number> {
  try {
    const nearby = await getNearbyRequests(userId);
    const [row] = await db()<{ n: number }[]>`
      SELECT count(*)::int AS n FROM demand_responses x JOIN demand_requests r ON r.id = x.request_id
      WHERE r.user_id = ${userId} AND NOT r.closed AND x.created_at > r.author_seen_at`;
    return nearby.filter((r) => r.is_new).length + (row?.n ?? 0);
  } catch {
    return 0;
  }
}

/** Пользователь открыл кабинет — новые запросы и отклики считаются просмотренными. */
export async function markDemandSeen(userId: string): Promise<void> {
  const sql = db();
  await sql`UPDATE users SET requests_seen_at = now() WHERE id = ${userId}`;
  await sql`UPDATE demand_requests SET author_seen_at = now() WHERE user_id = ${userId} AND NOT closed`;
}
