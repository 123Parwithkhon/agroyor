'use client';

import Link from 'next/link';
import { useState } from 'react';
import { GirihStar } from '@/components/ornaments';
import { formatMoney } from '@/lib/format';
import type { Lang } from '@/lib/i18n';
import { compareMarkets, parseAmount } from '@/lib/margin';

type Option = { id: number; name: string };

type Props = {
  lang: Lang;
  products: Option[];
  markets: Option[];
  /** Цены на дату таблицы: prices[productId][marketId] */
  prices: Record<number, Record<number, number | null>>;
  /** Аренда прицепа за день по умолчанию — самая дешёвая из каталога */
  defaultRent: number;
  /** Ссылка «Найти прицеп» (каталог с фильтром перевозки и районом пользователя) */
  transportHref: string;
  labels: {
    title: string; intro: string; product: string; qty: string; home: string; rent: string; fuel: string;
    market: string; revenue: string; transport: string; net: string; gain: string; homeTag: string;
    best: string; bestText: string; stayHome: string; findTrailer: string; noPrice: string; enterQty: string;
  };
};

const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';

/** Калькулятор маржи: связывает цены рынков с арендой транспорта в живые деньги для фермера. */
export default function MarginCalculator({ lang, products, markets, prices, defaultRent, transportHref, labels }: Props) {
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  // По умолчанию «мой рынок» — последний в списке (Исфара в демо), чтобы сразу показать выгоду поездки
  const [home, setHome] = useState(markets.at(-1)?.id ?? 0);
  const [qtyRaw, setQtyRaw] = useState('2000');
  const [rentRaw, setRentRaw] = useState(String(defaultRent));
  const [fuelRaw, setFuelRaw] = useState('250');

  const qty = parseAmount(qtyRaw);
  const rent = parseAmount(rentRaw) ?? 0;
  const fuel = parseAmount(fuelRaw) ?? 0;
  const productPrices = prices[productId] ?? {};
  const rows =
    qty && qty > 0
      ? compareMarkets({
          qty,
          homeMarketId: home,
          rent,
          fuel,
          prices: markets.map((m) => ({ marketId: m.id, price: productPrices[m.id] ?? null })),
        })
      : [];
  const nameOf = (id: number) => markets.find((m) => m.id === id)?.name ?? '';
  const best = rows[0];
  const money = (n: number) => formatMoney(n, lang);
  const signed = (n: number) => (n > 0 ? `+${money(n)}` : n < 0 ? `−${money(-n)}` : money(0));

  return (
    <section className="rounded-xl border border-sand-200 bg-white p-4 shadow-sm" aria-labelledby="margin-title">
      <h2 id="margin-title" className="flex items-center gap-2 text-xl font-bold text-lapis-900">
        <GirihStar className="size-5 shrink-0 text-anor-600" />
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-stone-600">{labels.intro}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="m-product" className="block text-sm font-medium">{labels.product}</label>
          <select id="m-product" value={productId} onChange={(e) => setProductId(Number(e.target.value))} className={control}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="m-qty" className="block text-sm font-medium">{labels.qty}</label>
          <input id="m-qty" inputMode="decimal" value={qtyRaw} onChange={(e) => setQtyRaw(e.target.value)} className={control} />
        </div>
        <div className="space-y-1">
          <label htmlFor="m-home" className="block text-sm font-medium">{labels.home}</label>
          <select id="m-home" value={home} onChange={(e) => setHome(Number(e.target.value))} className={control}>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="m-rent" className="block text-sm font-medium">{labels.rent}</label>
          <input id="m-rent" inputMode="decimal" value={rentRaw} onChange={(e) => setRentRaw(e.target.value)} className={control} />
        </div>
        <div className="space-y-1">
          <label htmlFor="m-fuel" className="block text-sm font-medium">{labels.fuel}</label>
          <input id="m-fuel" inputMode="decimal" value={fuelRaw} onChange={(e) => setFuelRaw(e.target.value)} className={control} />
        </div>
      </div>

      <div className="mt-4" aria-live="polite">
        {!qty ? (
          <p className="text-stone-600">{labels.enterQty}</p>
        ) : rows.length === 0 ? (
          <p className="text-stone-600">{labels.noPrice}</p>
        ) : (
          <>
            {best && (
              <p className={`rounded-lg p-3 font-semibold ${best.home ? 'bg-sand-100 text-stone-800' : 'bg-firuza-50 text-firuza-800'}`}>
                {best.home || best.gain === null || best.gain <= 0
                  ? labels.stayHome
                  : labels.bestText.replace('{market}', nameOf(best.marketId)).replace('{gain}', money(best.gain))}
              </p>
            )}
            {/* Карточки вместо широкой таблицы — читаются на экране 320px */}
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {rows.map((r, i) => (
                <li
                  key={r.marketId}
                  className={`rounded-lg border p-3 text-sm ${i === 0 ? 'border-firuza-700 ring-1 ring-firuza-700' : 'border-sand-200'}`}
                >
                  <p className="flex flex-wrap items-center justify-between gap-1 font-semibold text-lapis-900">
                    <span>
                      {nameOf(r.marketId)}
                      {r.home && <span className="ml-1 text-xs font-normal text-stone-500">({labels.homeTag})</span>}
                    </span>
                    {i === 0 && <span className="rounded-full bg-firuza-700 px-2 py-0.5 text-xs text-white">{labels.best}</span>}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-y-1 tabular-nums">
                    <dt className="text-stone-600">{labels.revenue}</dt>
                    <dd className="text-right">{money(r.revenue)}</dd>
                    <dt className="text-stone-600">{labels.transport}</dt>
                    <dd className="text-right">{r.transport ? `−${money(r.transport)}` : '—'}</dd>
                    <dt className="font-semibold">{labels.net}</dt>
                    <dd className="text-right font-semibold">{money(r.net)}</dd>
                    {r.gain !== null && !r.home && (
                      <>
                        <dt className="text-stone-600">{labels.gain}</dt>
                        <dd className={`text-right font-semibold ${r.gain > 0 ? 'text-firuza-800' : 'text-anor-700'}`}>{signed(r.gain)}</dd>
                      </>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
            <Link href={transportHref} className="mt-3 inline-flex min-h-11 items-center font-semibold text-firuza-700 underline">
              {labels.findTrailer}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
