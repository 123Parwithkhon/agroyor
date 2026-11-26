'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/landing/Icon';

export type SeasonView = {
  id: string;
  title: string;
  months: string;
  tasks: string;
  types: { key: string; label: string }[];
  products: { id: string | number; name: string }[];
};

type Props = {
  seasons: SeasonView[];
  current: string;
  labels: { now: string; equipment: string; products: string; openPrices: string; match: string };
};

/**
 * «Агро-календарь сезона» Согда: таймлайн из шести периодов, текущий подсвечен.
 * Нажатие на период показывает работы, нужную технику (ссылки в каталог) и сезонные товары (в таблицу цен).
 * Без JavaScript видно описание текущего периода — ссылки работают.
 */
export default function SeasonCalendar({ seasons, current, labels }: Props) {
  const [selected, setSelected] = useState(current);
  const s = seasons.find((x) => x.id === selected) ?? seasons[0];
  if (!s) return null;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-sand-200">
      <div role="tablist" aria-label={labels.now} className="grid grid-cols-3 gap-px bg-sand-200 sm:grid-cols-6">
        {seasons.map((x) => {
          const active = x.id === selected;
          const now = x.id === current;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="season-panel"
              onClick={() => setSelected(x.id)}
              className={`relative flex min-h-20 flex-col items-start justify-center gap-0.5 px-3 py-2 text-left transition ${
                active ? 'bg-lapis-900 text-white' : 'bg-white text-lapis-900 hover:bg-sand-50'
              }`}
            >
              <span className={`text-xs font-semibold uppercase tracking-wide ${active ? 'text-zar-300' : 'text-stone-500'}`}>
                {x.months}
              </span>
              <span className="text-sm font-bold leading-tight">{x.title}</span>
              {now && (
                <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-anor-600 px-1.5 text-[10px] font-bold text-white">
                  <span className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" />
                  {labels.now}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div id="season-panel" role="tabpanel" className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <p className="text-lg font-bold text-lapis-900">{s.title}</p>
          <p className="mt-1 leading-relaxed text-stone-700">{s.tasks}</p>
          <Link href="/equipment/match" className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold text-firuza-700 hover:underline">
            <Icon name="sparkles" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{labels.match} →
          </Link>
        </div>
        <div className="grid gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{labels.equipment}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {s.types.map((x) => (
                <li key={x.key}>
                  <Link
                    href={`/equipment?type=${x.key}`}
                    className="inline-flex min-h-9 items-center rounded-full bg-zar-50 px-3 text-sm font-semibold text-lapis-900 ring-1 ring-zar-300 hover:bg-lapis-900 hover:text-zar-300"
                  >
                    {x.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {s.products.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{labels.products}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {s.products.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/prices?season=${s.id}`}
                      className="inline-flex min-h-9 items-center rounded-full bg-firuza-50 px-3 text-sm font-semibold text-firuza-800 ring-1 ring-firuza-100 hover:bg-firuza-700 hover:text-white"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`/prices?season=${s.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-firuza-700 hover:underline">
                {labels.openPrices} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
