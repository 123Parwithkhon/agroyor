import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from '@/components/icons';
import { OrnateHeading } from '@/components/ornaments';
import Delta from '@/components/prices/Delta';
import PriceChart, { type ChartSeries } from '@/components/prices/PriceChart';
import { productUnitKey } from '@/lib/equipment';
import { formatDate, formatMoney, todayInDushanbe } from '@/lib/format';
import { getT } from '@/lib/i18n-server';
import { pickName, shiftDate } from '@/lib/prices-rules';
import { getHistory, getProduct, listMarkets } from '@/lib/queries/prices-manage';

// Линии рынков различаются и цветом, и штрихом (для дальтоников и печати)
const COLORS = ['#1e3a8a', '#0f766e', '#b0183f', '#a16207'];
const DASHES = ['0', '6 3', '2 3', '10 3 2 3'];

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ days?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).productId);
  const { lang, t } = await getT();
  return { title: product ? pickName(product, lang) : t('notFound.title') };
}

export default async function ProductPricesPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const sp = await searchParams;
  const days = sp.days === '7' ? 7 : 30;
  const { t, lang } = await getT();

  const product = await getProduct(productId);
  if (!product) notFound();

  const from = shiftDate(todayInDushanbe(), -(days - 1));
  const markets = await listMarkets(true);
  const history = await getHistory(product.id, from);

  const keyOf = new Map(markets.map((m, i) => [m.id, `m${i}`]));
  const series: ChartSeries[] = markets.map((m, i) => ({
    key: `m${i}`,
    name: pickName(m, lang),
    color: COLORS[i % COLORS.length] ?? '#1e3a8a',
    dash: DASHES[i % DASHES.length] ?? '0',
  }));

  // История упорядочена по дате: строка графика на каждый день, последняя и предпоследняя цена по рынку
  const byDate = new Map<string, Record<string, string | number>>();
  const latest = new Map<string, { date: string; price: number }>();
  const prev = new Map<string, number>();
  for (const r of history) {
    const k = keyOf.get(r.market_id);
    if (!k) continue;
    const row = byDate.get(r.price_date) ?? { label: formatDate(r.price_date, lang).replace(/\.\d{4}$|\s\d{4}$/, '') };
    row[k] = r.price;
    byDate.set(r.price_date, row);
    const old = latest.get(r.market_id);
    if (old) prev.set(r.market_id, old.price);
    latest.set(r.market_id, { date: r.price_date, price: r.price });
  }
  const data = [...byDate.values()];

  const deltaLabels = { up: t('prc.up'), down: t('prc.down'), same: t('prc.same') };
  const name = pickName(product, lang);
  const tab = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium ${
      active ? 'border-firuza-700 bg-firuza-700 text-white' : 'border-stone-300 bg-white'
    }`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link href="/prices" className="inline-flex min-h-11 items-center gap-1 self-start font-semibold text-firuza-700">
        <ArrowLeftIcon className="size-5" />
        {t('prc.back')}
      </Link>
      <div>
        <OrnateHeading as="h1">{name}</OrnateHeading>
        <p className="mt-1 text-sm text-stone-600">
          {t('prices.currency')} · 1 {t(productUnitKey(product.unit))}
        </p>
      </div>

      <div className="flex gap-2">
        <Link href={`/prices/${product.id}?days=7`} className={tab(days === 7)} aria-current={days === 7 ? 'page' : undefined}>
          {t('prc.days7')}
        </Link>
        <Link href={`/prices/${product.id}?days=30`} className={tab(days === 30)} aria-current={days === 30 ? 'page' : undefined}>
          {t('prc.days30')}
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-lapis-900">{t('prc.chartTitle')}</h2>
      {data.length === 0 ? (
        <p className="rounded-xl border border-sand-200 bg-white p-5 text-center text-stone-600">{t('prc.noHistory')}</p>
      ) : (
        <div className="rounded-xl border border-sand-200 bg-white p-2">
          <PriceChart data={data} series={series} ariaLabel={`${t('prc.chartTitle')}: ${name}`} />
        </div>
      )}

      {latest.size > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-lapis-900">{t('prc.latest')}</h2>
          <ul className="mt-3 space-y-2">
            {markets.map((m) => {
              const l = latest.get(m.id);
              if (!l) return null;
              const old = prev.get(m.id);
              return (
                <li key={m.id} className="flex justify-between gap-3 rounded-lg border border-sand-200 bg-white p-3 text-sm">
                  <span className="font-medium">{pickName(m, lang)}</span>
                  <span className="text-right tabular-nums">
                    <strong>{formatMoney(l.price, lang)}</strong> · {formatDate(l.date, lang)}
                    <Delta delta={old === undefined ? null : l.price - old} labels={deltaLabels} lang={lang} />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
