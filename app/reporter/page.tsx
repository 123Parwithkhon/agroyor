import Link from 'next/link';
import { OrnateHeading } from '@/components/ornaments';
import PriceEntryForm from '@/components/reporter/PriceEntryForm';
import { requireRole } from '@/lib/auth-guards';
import { productUnitKey } from '@/lib/equipment';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { todayInDushanbe } from '@/lib/format';
import { displayDate } from '@/lib/booking-rules';
import { pickName, shiftDate } from '@/lib/prices-rules';
import { getEnteredPrices, getPreviousPrices, listMarkets, listProducts } from '@/lib/queries/prices-manage';
import { savePricesAction } from './actions';

export const generateMetadata = () => pageMetadata('page.reporter');

export default async function ReporterPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string; saved?: string; d?: string }>;
}) {
  await requireRole('reporter', '/reporter');
  const sp = await searchParams;
  const { t, lang } = await getT();
  const today = todayInDushanbe();
  const dayKey = sp.d === 'yesterday' ? 'yesterday' : 'today';
  const date = dayKey === 'yesterday' ? shiftDate(today, -1) : today;

  const markets = await listMarkets(true);
  const market = markets.find((m) => m.id === sp.market);
  const btn =
    'inline-flex min-h-11 w-full items-center rounded-lg border border-firuza-700 px-4 font-semibold text-firuza-700';

  if (!market) {
    return (
      <div className="mx-auto w-full max-w-md">
        <OrnateHeading>{t('prc.reporterTitle')}</OrnateHeading>
        <p className="mt-4 font-medium">{t('prc.chooseMarket')}</p>
        {markets.length === 0 ? (
          <p className="mt-3 text-sm">{t('prc.noMarkets')}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {markets.map((m) => (
              <li key={m.id}>
                <Link href={`/reporter?market=${encodeURIComponent(m.id)}`} className={btn}>
                  {pickName(m, lang)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const products = await listProducts(true);
  const entered = await getEnteredPrices(market.id, date);
  // Последняя цена этого рынка до выбранного дня — подсказка репортёру
  const last = Object.fromEntries(
    (await getPreviousPrices(date)).filter((p) => p.market_id === market.id).map((p) => [p.product_id, p.price]),
  );

  const base = `/reporter?market=${encodeURIComponent(market.id)}`;
  const tab = (active: boolean) =>
    `inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border px-3 text-sm font-medium ${
      active ? 'border-firuza-700 bg-firuza-700 text-white' : 'border-stone-300 bg-white'
    }`;

  return (
    <div className="mx-auto w-full max-w-md">
      <OrnateHeading>{pickName(market, lang)}</OrnateHeading>
      <p className="mt-2 text-sm">
        <Link href="/reporter" className="underline">{t('prc.change')}</Link>
      </p>

      <div className="mt-4 flex gap-2" role="group" aria-label={t('prc.date')}>
        <Link href={`${base}&d=today`} className={tab(dayKey === 'today')} aria-current={dayKey === 'today' ? 'page' : undefined}>
          {t('prc.today')}
        </Link>
        <Link href={`${base}&d=yesterday`} className={tab(dayKey === 'yesterday')} aria-current={dayKey === 'yesterday' ? 'page' : undefined}>
          {t('prc.yesterday')}
        </Link>
      </div>
      <p className="mt-2 text-sm">
        {t('prc.date')}: <strong>{displayDate(date)}</strong>
      </p>

      {sp.saved === '1' && (
        <div role="status" className="mt-4 rounded-lg bg-firuza-50 p-3 text-sm">
          <p className="font-semibold text-firuza-800">{t('prc.saved')}</p>
          {/* На питче: сохранили с телефона — сразу показываем на сайте и в выгрузке */}
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/prices" className="inline-flex min-h-11 items-center rounded-lg bg-firuza-700 px-3 font-semibold text-white">
              {t('rep.viewSite')}
            </Link>
            <a href={`/api/prices.xlsx?from=${date}&to=${date}&market=${encodeURIComponent(market.id)}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-firuza-700 px-3 font-semibold text-firuza-800">
              {t('prc.xlsx')}
            </a>
          </div>
        </div>
      )}
      <div className="mt-6">
        <PriceEntryForm
          key={`${market.id}-${dayKey}`}
          action={savePricesAction.bind(null, market.id, dayKey)}
          msgs={{
            'err.pricesInvalid': t('err.pricesInvalid'),
            'err.pricesEmpty': t('err.pricesEmpty'),
            'err.generic': t('err.generic'),
          }}
          items={products.map((p) => ({
            id: p.id,
            name: pickName(p, lang),
            unit: t(productUnitKey(p.unit)),
            value: entered[p.id] !== undefined ? String(entered[p.id]).replace('.', ',') : '',
            last: last[p.id] ?? null,
          }))}
          labels={{
            hint: t('prc.hint'), save: t('prc.save'), last: t('rep.last'), fillLast: t('rep.fillLast'),
            quick: t('rep.quick'), check: t('rep.check'),
          }}
        />
      </div>
    </div>
  );
}