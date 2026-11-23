import 'server-only';
import { db } from '@/lib/db';
import type { ProductUnit } from '@/lib/equipment';

export type BoardMarket = { id: number; name_tj: string; name_ru: string; name_en: string };

export type BoardRow = {
  product: { id: number; name_tj: string; name_ru: string; name_en: string; unit: ProductUnit };
  /** Цена по id рынка: текущая и предыдущая (для стрелки ↑↓); null — цены нет */
  cells: Record<number, { price: number | null; prev: number | null }>;
};

export type PriceBoard = { date: string | null; markets: BoardMarket[]; rows: BoardRow[] };

type Flat = {
  product_id: number;
  name_tj: string;
  name_ru: string;
  name_en: string;
  unit: ProductUnit;
  market_id: number;
  price: number | null;
  prev: number | null;
};

/**
 * Мини-график для таблицы: средняя по рынкам цена каждого продукта за 7 дней до date (включительно).
 * Дни без цен пропускаются. Ключ — id продукта.
 */
export async function getWeekTrend(date: string): Promise<Record<number, number[]>> {
  const rows = await db()<{ product_id: number; avg: number }[]>`
    SELECT product_id, round(avg(price), 2) AS avg
    FROM prices
    WHERE date BETWEEN ${date}::date - 6 AND ${date}::date
    GROUP BY product_id, date
    ORDER BY product_id, date`;
  const out: Record<number, number[]> = {};
  for (const r of rows) (out[r.product_id] ??= []).push(r.avg);
  return out;
}

/** Самая дешёвая доступная техника для перевозки за день (для калькулятора выгоды); null — нет такой. */
export async function getCheapestTransportPerDay(): Promise<number | null> {
  const [row] = await db()<{ price: number | null }[]>`
    SELECT min(e.price) AS price
    FROM equipment e JOIN users u ON u.id = e.owner_id
    WHERE e.active AND NOT e.hidden_by_admin AND NOT u.blocked
      AND e.price_unit = 'day' AND 'transport' = ANY(e.works)`;
  return row?.price ?? null;
}

/**
 * Таблица цен «продукт × рынок» на последнюю дату с данными, не позже onDate.
 * Для каждой цены — предыдущая известная цена того же рынка (для стрелки к прошлому дню).
 */
export async function getPriceBoard(onDate: string): Promise<PriceBoard> {
  const sql = db();
  const [latest] = await sql<{ d: string | null }[]>`SELECT max(date) AS d FROM prices WHERE date <= ${onDate}`;
  const date = latest?.d ?? null;
  const markets = await sql<BoardMarket[]>`
    SELECT id, name_tj, name_ru, name_en FROM markets WHERE active ORDER BY sort_order, id`;
  if (!date) return { date, markets, rows: [] };

  const flat = await sql<Flat[]>`
    SELECT p.id AS product_id, p.name_tj, p.name_ru, p.name_en, p.unit, m.id AS market_id,
           cur.price, prev.price AS prev
    FROM products p
    CROSS JOIN markets m
    LEFT JOIN prices cur ON cur.product_id = p.id AND cur.market_id = m.id AND cur.date = ${date}
    LEFT JOIN LATERAL (
      SELECT x.price FROM prices x
      WHERE x.product_id = p.id AND x.market_id = m.id AND x.date < ${date}
      ORDER BY x.date DESC LIMIT 1
    ) prev ON true
    WHERE p.active AND m.active
    ORDER BY p.sort_order, p.id, m.sort_order, m.id`;

  const rows: BoardRow[] = [];
  for (const f of flat) {
    let row = rows.at(-1);
    if (!row || row.product.id !== f.product_id) {
      row = {
        product: { id: f.product_id, name_tj: f.name_tj, name_ru: f.name_ru, name_en: f.name_en, unit: f.unit },
        cells: {},
      };
      rows.push(row);
    }
    row.cells[f.market_id] = { price: f.price, prev: f.prev };
  }
  return { date, markets, rows };
}
