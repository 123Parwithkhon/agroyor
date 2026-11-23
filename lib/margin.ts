// «Где выгоднее продать урожай?» — сравнение рынков с учётом затрат на перевозку.
// Чистые функции: используются в клиентском калькуляторе и проверяются тестами.
import { rentalCost } from '@/lib/booking-rules';

export type MarketPrice = { marketId: number; price: number | null };

export type MarginRow = {
  marketId: number;
  price: number;
  /** Выручка: количество × цена */
  revenue: number;
  /** Затраты на перевозку (0 — продажа на своём рынке) */
  transport: number;
  /** Выручка минус перевозка */
  net: number;
  /** Разница с продажей на своём рынке (null, если на своём рынке нет цены) */
  gain: number | null;
  home: boolean;
};

export type MarginInput = {
  /** Количество в единицах продукта (кг) */
  qty: number;
  homeMarketId: number;
  prices: MarketPrice[];
  /** Аренда транспорта за рейс (например, прицеп на день) */
  rent: number;
  /** Топливо и прочие расходы за рейс */
  fuel: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Строки по рынкам с ценой, самый выгодный — первым. */
export function compareMarkets({ qty, homeMarketId, prices, rent, fuel }: MarginInput): MarginRow[] {
  const homePrice = prices.find((p) => p.marketId === homeMarketId)?.price ?? null;
  const homeNet = homePrice === null ? null : rentalCost(qty, homePrice);
  const rows: MarginRow[] = [];
  for (const p of prices) {
    if (p.price === null) continue;
    const home = p.marketId === homeMarketId;
    const revenue = rentalCost(qty, p.price);
    const transport = home ? 0 : round2(rent + fuel);
    const net = round2(revenue - transport);
    rows.push({
      marketId: p.marketId,
      price: p.price,
      revenue,
      transport,
      net,
      gain: homeNet === null ? null : round2(net - homeNet),
      home,
    });
  }
  return rows.sort((a, b) => b.net - a.net || Number(b.home) - Number(a.home));
}

/** Число из поля ввода (запятая или точка), неотрицательное; иначе null. */
export function parseAmount(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n <= 10_000_000 ? n : null;
}
