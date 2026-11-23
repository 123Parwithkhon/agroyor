import Link from 'next/link';
import { DownloadIcon } from '@/components/icons';
import { OrnateHeading } from '@/components/ornaments';
import { PriceTable } from '@/components/PriceTable';
import MarginCalculator from '@/components/prices/MarginCalculator';
import { SmartHints } from '@/components/prices/SmartHints';
import { getCurrentUser } from '@/lib/auth-guards';
import { todayInDushanbe } from '@/lib/format';
import { localizedName } from '@/lib/i18n';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { isIsoDate } from '@/lib/prices-rules';
import { getCheapestTransportPerDay, getPriceBoard, getWeekTrend } from '@/lib/queries/prices';
import { getUserDistrict } from '@/lib/queries/user';

export const generateMetadata = () => pageMetadata('prc.pageTitle');

type Props = { searchParams: Promise<{ date?: string }> };

// Цены рынков на выбранную дату: таблица с мини-графиками за неделю, умная подсказка,
// калькулятор «где выгоднее продать». Выбор даты — обычная GET-форма (работает без JS).
export default async function PricesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const today = todayInDushanbe();
  const date = isIsoDate(sp.date) && sp.date <= today ? sp.date : today;
  const { lang, t } = await getT();

  // Последовательно, а не Promise.all: локальная PGlite работает через одно соединение
  const board = await getPriceBoard(date);
  const trend = board.date ? await getWeekTrend(board.date) : {};
  const rent = (await getCheapestTransportPerDay()) ?? 150;
  const user = await getCurrentUser();
  const district = user ? await getUserDistrict(user.id) : null;

  const transportHref = `/equipment?work=transport${district ? `&district=${district}` : ''}`;
  const priceMap: Record<number, Record<number, number | null>> = {};
  for (const row of board.rows) {
    priceMap[row.product.id] = Object.fromEntries(Object.entries(row.cells).map(([m, c]) => [m, c.price]));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrnateHeading as="h1">{t('prc.pageTitle')}</OrnateHeading>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/prices.csv?from=${board.date ?? date}&to=${board.date ?? date}`}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 font-medium text-firuza-800"
          >
            <DownloadIcon className="size-5" />
            {t('prc.csv')}
          </a>
          {user?.roles.includes('reporter') && (
            <Link href="/reporter" className="inline-flex min-h-11 items-center rounded-lg bg-firuza-700 px-3 font-semibold text-white">
              {t('prc.reporterLink')}
            </Link>
          )}
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-2" role="search">
        <div className="space-y-1">
          <label htmlFor="p-date" className="block text-sm font-medium">{t('prc.date')}</label>
          <input
            id="p-date"
            type="date"
            name="date"
            max={today}
            defaultValue={date}
            className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-base"
          />
        </div>
        <button type="submit" className="min-h-11 rounded-lg bg-firuza-700 px-4 font-semibold text-white hover:bg-firuza-800">
          {t('prc.show')}
        </button>
      </form>

      {board.date && board.date !== date && (
        <p className="text-sm text-stone-600">{t('prc.noData')}</p>
      )}
      <div>
        <PriceTable board={board} lang={lang} t={t} trend={trend} />
        {board.rows.length > 0 && <p className="mt-2 text-sm text-stone-600">{t('prc.chartsHint')}</p>}
      </div>

      <SmartHints board={board} lang={lang} t={t} district={district} />

      {board.rows.length > 0 && (
        <MarginCalculator
          lang={lang}
          products={board.rows.map((r) => ({ id: r.product.id, name: localizedName(r.product, lang) }))}
          markets={board.markets.map((m) => ({ id: m.id, name: localizedName(m, lang) }))}
          prices={priceMap}
          defaultRent={rent}
          transportHref={transportHref}
          labels={{
            title: t('margin.title'), intro: t('margin.intro'), product: t('margin.product'), qty: t('margin.qty'),
            home: t('margin.home'), rent: t('margin.rent'), fuel: t('margin.fuel'), market: t('margin.market'),
            revenue: t('margin.revenue'), transport: t('margin.transport'), net: t('margin.net'), gain: t('margin.gain'),
            homeTag: t('margin.homeTag'), best: t('margin.best'), bestText: t('margin.bestText'),
            stayHome: t('margin.stayHome'), findTrailer: t('margin.findTrailer'), noPrice: t('margin.noPrice'),
            enterQty: t('margin.enterQty'),
          }}
        />
      )}
    </div>
  );
}
