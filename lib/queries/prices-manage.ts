import 'server-only';
import { db } from '@/lib/db';
import type { ProductUnit } from '@/lib/equipment';
import type { Named } from '@/lib/prices-rules';

// id — строкой: их сравнивают с параметрами адреса и полями форм
export type Market = Named & { id: string; sort_order: number; active: boolean };
export type Product = Named & {
  id: string;
  unit: ProductUnit;
  sort_order: number;
  active: boolean;
};

export async function listMarkets(onlyActive: boolean): Promise<Market[]> {
  const sql = db();
  return sql<Market[]>`
    SELECT id::text AS id, name_tj, name_ru, name_en, sort_order, active FROM markets
    WHERE ${onlyActive ? sql`active` : sql`true`}
    ORDER BY sort_order, id
  `;
}

export async function listProducts(onlyActive: boolean): Promise<Product[]> {
  const sql = db();
  return sql<Product[]>`
    SELECT id::text AS id, name_tj, name_ru, name_en, unit, sort_order, active FROM products
    WHERE ${onlyActive ? sql`active` : sql`true`}
    ORDER BY sort_order, id
  `;
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!/^\d{1,9}$/.test(id)) return null; // неверный формат id в адресе
  const [row] = await db()<Product[]>`
    SELECT id::text AS id, name_tj, name_ru, name_en, unit, sort_order, active
    FROM products WHERE id = ${id}
  `;
  return row ?? null;
}

// Уже введённые цены рынка за день: { productId: price }
export async function getEnteredPrices(marketId: string, date: string): Promise<Record<string, number>> {
  const rows = await db()<{ product_id: string; price: number }[]>`
    SELECT product_id::text AS product_id, price FROM prices
    WHERE market_id = ${marketId} AND date = ${date}::date
  `;
  return Object.fromEntries(rows.map((r) => [r.product_id, r.price]));
}

// Одна запись на рынок + продукт + день; повторный ввод обновляет цену
export async function upsertPrices(
  marketId: string,
  date: string,
  reporterId: string,
  entries: { productId: string; price: number }[],
): Promise<void> {
  const rows = entries.map((e) => ({
    market_id: marketId,
    product_id: e.productId,
    date,
    price: e.price,
    reporter_id: reporterId,
  }));
  const sql = db();
  await sql`
    INSERT INTO prices ${sql(rows, 'market_id', 'product_id', 'date', 'price', 'reporter_id')}
    ON CONFLICT (market_id, product_id, date)
    DO UPDATE SET price = EXCLUDED.price, reporter_id = EXCLUDED.reporter_id
  `;
}

export async function getLatestPriceDate(onOrBefore: string): Promise<string | null> {
  const [row] = await db()<{ d: string | null }[]>`
    SELECT max(date) AS d FROM prices WHERE date <= ${onOrBefore}::date`;
  return row?.d ?? null;
}

export type DayPrice = { market_id: string; product_id: string; price: number };

export async function getPricesByDate(date: string): Promise<DayPrice[]> {
  return db()<DayPrice[]>`
    SELECT market_id::text AS market_id, product_id::text AS product_id, price
    FROM prices WHERE date = ${date}::date
  `;
}

// Последняя известная цена до указанной даты (не старше 14 дней) — для расчёта изменения
export async function getPreviousPrices(date: string): Promise<DayPrice[]> {
  return db()<DayPrice[]>`
    SELECT DISTINCT ON (market_id, product_id)
           market_id::text AS market_id, product_id::text AS product_id, price
    FROM prices
    WHERE date < ${date}::date AND date >= ${date}::date - 14
    ORDER BY market_id, product_id, date DESC
  `;
}

export type HistoryPoint = { price_date: string; market_id: string; price: number };

export async function getHistory(productId: string, from: string): Promise<HistoryPoint[]> {
  return db()<HistoryPoint[]>`
    SELECT date AS price_date, market_id::text AS market_id, price FROM prices
    WHERE product_id = ${productId} AND date >= ${from}::date
    ORDER BY date
  `;
}

export type CsvRow = {
  price_date: string;
  market_tj: string; market_ru: string; market_en: string;
  product_tj: string; product_ru: string; product_en: string;
  unit: ProductUnit;
  price: number;
};

// null — неверный формат id рынка
export async function getPricesRange(from: string, to: string, marketId: string | null): Promise<CsvRow[] | null> {
  if (marketId !== null && !/^\d{1,9}$/.test(marketId)) return null;
  const sql = db();
  return sql<CsvRow[]>`
    SELECT pr.date AS price_date,
           m.name_tj AS market_tj, m.name_ru AS market_ru, m.name_en AS market_en,
           pd.name_tj AS product_tj, pd.name_ru AS product_ru, pd.name_en AS product_en,
           pd.unit, pr.price
    FROM prices pr
    JOIN markets m ON m.id = pr.market_id
    JOIN products pd ON pd.id = pr.product_id
    WHERE pr.date BETWEEN ${from}::date AND ${to}::date
      AND ${marketId ? sql`pr.market_id = ${marketId}` : sql`true`}
    ORDER BY pr.date, m.sort_order, m.id, pd.sort_order, pd.id
  `;
}
