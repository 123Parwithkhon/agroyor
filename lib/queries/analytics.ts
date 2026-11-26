import 'server-only';
import { db } from '@/lib/db';
import { DISTRICTS } from '@/lib/districts';
import type { EquipmentType } from '@/lib/equipment';
import { todayInDushanbe } from '@/lib/format';
import { districtDistanceKm } from '@/lib/geo';
import { computeImpact, loadLevel, shortages, type Gap, type Impact, type Load } from '@/lib/impact';
import { shiftDate } from '@/lib/prices-rules';

/** Период загруженности: 30 дней назад и 30 вперёд (включая сегодня). */
export const LOAD_PERIOD_DAYS = 60;

export type DistrictStat = {
  district: string;
  machines: number;
  byType: Partial<Record<EquipmentType, number>>;
  bookedDays: number;
  percent: number;
  level: Load;
  /** Заявки фермеров этого района + «клич» за 90 дней */
  demand: number;
  openRequests: number;
};

export type Idle = { district: string; type: EquipmentType; machines: number };

export type RegionAnalytics = {
  districts: DistrictStat[];
  shortages: Gap[];
  idle: Idle[];
  impact: Impact;
  hectares: number;
  totals: { machines: number; bookings: number; requests: number; owners: number };
};

export async function getRegionAnalytics(): Promise<RegionAnalytics> {
  const sql = db();
  const today = todayInDushanbe();
  const from = shiftDate(today, -30);
  const to = shiftDate(today, LOAD_PERIOD_DAYS - 31);
  const since = shiftDate(today, -90);

  // Последовательно: локальная PGlite работает через одно соединение
  const machines = await sql<{ id: number; district: string; type: EquipmentType; owner_id: number }[]>`
    SELECT e.id, e.district, e.type, e.owner_id FROM equipment e JOIN users u ON u.id = e.owner_id
    WHERE e.active AND NOT e.hidden_by_admin AND NOT u.blocked`;
  const busy = await sql<{ equipment_id: number; days: number }[]>`
    SELECT b.equipment_id,
           sum(least(b.end_date, ${to}::date) - greatest(b.start_date, ${from}::date) + 1)::int AS days
    FROM bookings b
    WHERE b.status IN ('confirmed', 'done') AND b.end_date >= ${from}::date AND b.start_date <= ${to}::date
    GROUP BY b.equipment_id`;
  const bookingDemand = await sql<{ district: string; type: EquipmentType; n: number }[]>`
    SELECT u.district, e.type, count(*)::int AS n
    FROM bookings b JOIN users u ON u.id = b.renter_id JOIN equipment e ON e.id = b.equipment_id
    WHERE b.status <> 'cancelled' AND b.created_at >= ${since}::date
    GROUP BY u.district, e.type`;
  const requestDemand = await sql<{ district: string; type: EquipmentType; n: number; open: number }[]>`
    SELECT district, type, count(*)::int AS n,
           count(*) FILTER (WHERE NOT closed AND need_date >= ${today}::date)::int AS open
    FROM demand_requests WHERE created_at >= ${since}::date
    GROUP BY district, type`;
  const served = await sql<{ eq_district: string; renter_district: string; joins: number; qty: number | null; unit: string }[]>`
    SELECT e.district AS eq_district, u.district AS renter_district,
           (SELECT count(*)::int FROM booking_joins j WHERE j.booking_id = b.id) AS joins,
           b.qty + coalesce((SELECT sum(area_ha) FROM booking_joins j WHERE j.booking_id = b.id), 0) AS qty,
           e.price_unit AS unit
    FROM bookings b JOIN equipment e ON e.id = b.equipment_id JOIN users u ON u.id = b.renter_id
    WHERE b.status IN ('confirmed', 'done')`;

  const busyById = new Map(busy.map((b) => [b.equipment_id, b.days]));
  const busyCountByKey = new Map<string, number>();
  const districts: DistrictStat[] = DISTRICTS.map((d) => {
    const own = machines.filter((m) => m.district === d.code);
    const byType: Partial<Record<EquipmentType, number>> = {};
    let bookedDays = 0;
    for (const m of own) {
      byType[m.type] = (byType[m.type] ?? 0) + 1;
      const days = busyById.get(m.id) ?? 0;
      bookedDays += days;
      if (days > 0) busyCountByKey.set(`${d.code}|${m.type}`, (busyCountByKey.get(`${d.code}|${m.type}`) ?? 0) + 1);
    }
    const { percent, level } = loadLevel(bookedDays, own.length, LOAD_PERIOD_DAYS);
    const demand =
      bookingDemand.filter((x) => x.district === d.code).reduce((s, x) => s + x.n, 0) +
      requestDemand.filter((x) => x.district === d.code).reduce((s, x) => s + x.n, 0);
    const openRequests = requestDemand.filter((x) => x.district === d.code).reduce((s, x) => s + x.open, 0);
    return { district: d.code, machines: own.length, byType, bookedDays, percent, level, demand, openRequests };
  });

  // Дефицит: спрос района на вид техники против машин этого вида в районе
  const demandByKey = new Map<string, number>();
  for (const x of [...bookingDemand, ...requestDemand]) {
    const k = `${x.district}|${x.type}`;
    demandByKey.set(k, (demandByKey.get(k) ?? 0) + x.n);
  }
  const gaps: Gap[] = [...demandByKey.entries()].map(([k, n]) => {
    const [district = '', type = ''] = k.split('|');
    return { district, type, demand: n, supply: machines.filter((m) => m.district === district && m.type === type).length };
  });

  // Простой: виды техники района, у которых ни одна машина не занята за период
  const idle: Idle[] = [];
  for (const d of districts) {
    for (const [type, count] of Object.entries(d.byType) as [EquipmentType, number][]) {
      if (!busyCountByKey.has(`${d.district}|${type}`)) idle.push({ district: d.district, type, machines: count });
    }
  }
  idle.sort((a, b) => b.machines - a.machines);

  const impact = computeImpact(
    served.map((s) => ({ distanceKm: districtDistanceKm(s.eq_district, s.renter_district) ?? 0, farms: 1 + s.joins })),
  );
  const hectares = Math.round(served.reduce((sum, s) => sum + (s.unit === 'hectare' ? Number(s.qty ?? 0) : 0), 0) * 10) / 10;
  const [counts] = await sql<{ bookings: number; requests: number }[]>`
    SELECT (SELECT count(*)::int FROM bookings WHERE status IN ('confirmed', 'done')) AS bookings,
           (SELECT count(*)::int FROM demand_requests) AS requests`;

  return {
    districts,
    shortages: shortages(gaps).slice(0, 6),
    idle: idle.slice(0, 6),
    impact,
    hectares,
    totals: {
      machines: machines.length,
      bookings: counts?.bookings ?? 0,
      requests: counts?.requests ?? 0,
      owners: new Set(machines.map((m) => m.owner_id)).size,
    },
  };
}
