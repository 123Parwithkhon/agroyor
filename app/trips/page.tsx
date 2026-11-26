import Link from 'next/link';
import { PhoneIcon, PinIcon } from '@/components/icons';
import { OrnateHeading } from '@/components/ornaments';
import { getCurrentUser } from '@/lib/auth-guards';
import { DISTRICTS, districtName, type DistrictCode } from '@/lib/districts';
import { num } from '@/lib/duration';
import { productUnitKey } from '@/lib/equipment';
import { fill } from '@/lib/fill';
import { formatDate, formatMoney, todayInDushanbe } from '@/lib/format';
import { DISTRICT_CENTERS, distanceKm, marketPoint, nearestIndex } from '@/lib/geo';
import { localizedName } from '@/lib/i18n';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { formatPhone, telLink } from '@/lib/phone';
import { shiftDate } from '@/lib/prices-rules';
import { getCheapestTransportPerDay, getPriceBoard } from '@/lib/queries/prices';
import { fellowTrips, getTransport, getUpcomingTrips } from '@/lib/queries/trips';
import { getUserDistrict } from '@/lib/queries/user';
import { calcTrip, parseTons, RIDE_SHARE_KM } from '@/lib/trips';
import { createTripAction, deleteTripAction } from './actions';
import Icon from '@/components/landing/Icon';

export const generateMetadata = () => pageMetadata('trips.title');

type SP = { product?: string; tons?: string; from?: string; market?: string; date?: string; eq?: string; posted?: string; error?: string };

// «Цифровой маршрут урожая»: рейс поле → рынок. Цена в точке А (ближайший рынок) и в точке Б,
// стоимость рейса и попутная загрузка — фермеры с соседних полей в тот же день делят рейс.
export default async function TripsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, t } = await getT();
  const user = await getCurrentUser();
  const today = todayInDushanbe();

  // Последовательно: локальная PGlite работает через одно соединение
  const board = await getPriceBoard(today);
  const home = user ? await getUserDistrict(user.id) : null;
  const transport = sp.eq ? await getTransport(sp.eq) : null;
  const cheapest = (await getCheapestTransportPerDay()) ?? 150;
  const all = await getUpcomingTrips(user?.id ?? null);

  const products = board.rows.map((r) => r.product);
  const markets = board.markets;
  const product = products.find((p) => String(p.id) === sp.product) ?? products.find((p) => p.name_en === 'Apples') ?? products[0];
  const market = markets.find((m) => String(m.id) === sp.market) ?? markets[0];
  const from: DistrictCode = DISTRICTS.some((d) => d.code === sp.from)
    ? (sp.from as DistrictCode)
    : ((transport?.district ?? home ?? 'istaravshan') as DistrictCode);
  const date = sp.date && sp.date >= today ? sp.date : shiftDate(today, 1);
  const tons = parseTons(sp.tons ?? '3');
  const submitted = sp.product !== undefined;
  const rentPerDay = transport && transport.price_unit === 'day' ? transport.price : cheapest;

  const field = DISTRICT_CENTERS[from];
  const points = markets.map((m) => marketPoint([m.name_tj, m.name_ru, m.name_en]));
  const aIndex = nearestIndex(field, points);
  const marketA = aIndex === null ? null : (markets[aIndex] ?? null);
  const pointB = market ? points[markets.indexOf(market)] : null;
  const km = pointB ? Math.round(distanceKm(field, pointB)) : 0;

  const row = product ? board.rows.find((r) => r.product.id === product.id) : undefined;
  const priceA = marketA && row ? (row.cells[marketA.id]?.price ?? null) : null;
  const priceB = market && row ? (row.cells[market.id]?.price ?? null) : null;
  const fellows = market ? fellowTrips(all, { date, marketId: market.id, from, userId: user?.id ?? null }) : [];
  const calc =
    tons !== null && market
      ? calcTrip({ tons, priceA, priceB, rentPerDay, distanceKm: km, riders: 1 + fellows.length, sameMarket: marketA?.id === market.id })
      : null;
  const mine = user ? all.filter((x) => x.user_id === user.id) : [];

  const control = 'min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base';
  const money = (v: number) => formatMoney(v, lang);
  const marketName = (id: number) => {
    const m = markets.find((x) => x.id === id);
    return m ? localizedName(m, lang) : '';
  };

  // Ближайшие рейсы по дням и рынкам
  const groups = new Map<string, typeof all>();
  for (const x of all) {
    const k = `${x.trip_date}|${x.market_id}`;
    groups.set(k, [...(groups.get(k) ?? []), x]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <OrnateHeading as="h1"><Icon name="truck" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('trips.title')}</OrnateHeading>
        <p className="mt-2 max-w-2xl text-stone-700">{t('trips.intro')}</p>
        {transport && (
          <p className="mt-2 inline-flex rounded-full bg-firuza-50 px-3 py-1 text-sm font-medium text-firuza-800">
            {fill(t('trips.withTransport'), { title: transport.title, price: money(transport.price) })}
          </p>
        )}
      </div>

      <form className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand-200 sm:grid-cols-2 sm:p-6 lg:grid-cols-5" action="/trips">
        {transport && <input type="hidden" name="eq" value={transport.id} />}
        <label className="grid gap-1 text-sm font-medium">
          {t('trips.product')}
          <select name="product" defaultValue={product ? String(product.id) : ''} className={control}>
            {products.map((p) => <option key={p.id} value={p.id}>{localizedName(p, lang)}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t('trips.tons')}
          <input name="tons" inputMode="decimal" defaultValue={sp.tons ?? '3'} required className={control} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t('trips.from')}
          <select name="from" defaultValue={from} className={control}>
            {DISTRICTS.map((d) => <option key={d.code} value={d.code}>{d[lang]}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t('trips.to')}
          <select name="market" defaultValue={market ? String(market.id) : ''} className={control}>
            {markets.map((m) => <option key={m.id} value={m.id}>{localizedName(m, lang)}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t('trips.date')}
          <input type="date" name="date" min={today} max={shiftDate(today, 59)} defaultValue={date} className={control} />
        </label>
        <button type="submit" className="min-h-12 rounded-xl bg-firuza-700 px-4 font-bold text-white hover:bg-firuza-800 sm:col-span-2 lg:col-span-5">
          {t('trips.calc')}
        </button>
        {submitted && tons === null && <p role="alert" className="text-sm text-anor-700 sm:col-span-2 lg:col-span-5">{t('trips.tonsError')}</p>}
      </form>

      {calc && product && market && (
        <section className="flex flex-col gap-4" aria-live="polite">
          {/* Маршрут: точка А (рынок у поля) → точка Б */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-sand-200">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('trips.pointA')}</p>
              <p className="mt-1 flex items-center gap-1 font-bold text-lapis-900"><PinIcon className="size-4 text-anor-600" />{districtName(from, lang)}</p>
              <p className="text-sm text-stone-600">
                {marketA ? fill(t('trips.nearestMarket'), { market: localizedName(marketA, lang) }) : '—'}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-lapis-900">
                {priceA === null ? '—' : `${money(priceA)}/${t(productUnitKey(product.unit))}`}
              </p>
            </div>
            <div className="flex items-center justify-center text-3xl text-firuza-700" aria-hidden="true">→</div>
            <div className="rounded-2xl bg-lapis-900 p-4 text-white on-dark">
              <p className="text-xs font-bold uppercase tracking-wide text-zar-300">{t('trips.pointB')}</p>
              <p className="mt-1 font-bold">{localizedName(market, lang)}</p>
              <p className="text-sm text-lapis-100/80">{fill(t('trips.distance'), { km })}</p>
              <p className="mt-2 text-2xl font-extrabold text-zar-300">
                {priceB === null ? '—' : `${money(priceB)}/${t(productUnitKey(product.unit))}`}
              </p>
            </div>
          </div>

          <dl className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:grid-cols-4">
            <div>
              <dt className="text-sm text-stone-600">{fill(t('trips.revenueAt'), { market: localizedName(market, lang) })}</dt>
              <dd className="text-xl font-bold">{calc.revenueB === null ? '—' : money(calc.revenueB)}</dd>
            </div>
            <div>
              <dt className="text-sm text-stone-600">{t('trips.tripCost')}</dt>
              <dd className="text-xl font-bold">{money(calc.tripCost)}</dd>
            </div>
            <div>
              <dt className="text-sm text-stone-600">{t('trips.myShare')}</dt>
              <dd className="text-xl font-bold text-firuza-800">
                {money(calc.myShare)}
                {calc.riders > 1 && <span className="ms-1 text-sm font-medium text-stone-600">({fill(t('trips.splitBy'), { n: calc.riders })})</span>}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-stone-600">{t('trips.gain')}</dt>
              <dd className={`text-xl font-extrabold ${calc.gain !== null && calc.gain < 0 ? 'text-anor-700' : 'text-firuza-800'}`}>
                {calc.gain === null ? t('trips.sameMarket') : `${calc.gain > 0 ? '+' : ''}${money(calc.gain)}`}
              </dd>
            </div>
          </dl>

          <div id="fellows" className="rounded-2xl bg-zar-50 p-4 ring-1 ring-zar-300">
            <p className="font-bold text-lapis-900">
              <Icon name="handshake" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{fellows.length > 0
                ? fill(t('trips.fellows'), { n: fellows.length, market: localizedName(market, lang), date: formatDate(date, lang), share: money(calc.myShare), full: money(calc.tripCost) })
                : fill(t('trips.noFellows'), { km: RIDE_SHARE_KM })}
            </p>
            {fellows.length > 0 && (
              <ul className="mt-3 grid gap-2">
                {fellows.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm">
                    <span>
                      <b>{f.name}</b> · {districtName(f.from_district, lang)} · {localizedName({ name_tj: f.product_tj, name_ru: f.product_ru, name_en: f.product_en }, lang)}, {num(f.tons, lang)} {t('trips.t')}
                    </span>
                    {f.phone ? (
                      <a href={telLink(f.phone)} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-firuza-700 px-3 font-semibold text-white">
                        <PhoneIcon className="size-4" /> {formatPhone(f.phone)}
                      </a>
                    ) : (
                      <Link href={`/login?next=${encodeURIComponent('/trips')}`} className="font-semibold text-firuza-700 underline">{t('trips.loginForPhone')}</Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {sp.posted === '1' ? (
              <p role="status" className="mt-3 font-semibold text-firuza-800"><Icon name="check" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('trips.posted')}</p>
            ) : (
              <form action={createTripAction} className="mt-3">
                <input type="hidden" name="product" value={product.id} />
                <input type="hidden" name="tons" value={sp.tons ?? '3'} />
                <input type="hidden" name="from" value={from} />
                <input type="hidden" name="market" value={market.id} />
                <input type="hidden" name="date" value={date} />
                <button type="submit" className="inline-flex min-h-12 items-center rounded-xl bg-zar-400 px-5 font-bold text-lapis-900 hover:bg-zar-300">
                  {t('trips.post')}
                </button>
                <span className="ms-3 text-sm text-stone-600">{t('trips.postHint')}</span>
              </form>
            )}
            {sp.error && <p role="alert" className="mt-2 text-sm text-anor-700">{t('err.generic')}</p>}
          </div>
          <p className="text-xs text-stone-500">{fill(t('trips.note'), { rent: money(rentPerDay) })}</p>
        </section>
      )}

      <section>
        <OrnateHeading>{t('trips.upcoming')}</OrnateHeading>
        {groups.size === 0 ? (
          <p className="mt-3 rounded-xl bg-white p-5 text-center text-stone-600 ring-1 ring-sand-200">{t('trips.none')}</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[...groups.entries()].map(([k, list]) => {
              const first = list[0]!;
              const totalT = list.reduce((s, x) => s + Number(x.tons), 0);
              return (
                <li key={k} className="rounded-2xl bg-white p-4 ring-1 ring-sand-200">
                  <p className="font-bold text-lapis-900">
                    {formatDate(first.trip_date, lang)} → {marketName(first.market_id)}
                  </p>
                  <p className="text-sm text-stone-600">{fill(t('trips.groupSummary'), { n: list.length, tons: num(totalT, lang) })}</p>
                  <ul className="mt-2 grid gap-1 text-sm">
                    {list.map((x) => (
                      <li key={x.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {x.name} · {districtName(x.from_district, lang)} · {localizedName({ name_tj: x.product_tj, name_ru: x.product_ru, name_en: x.product_en }, lang)} {num(x.tons, lang)} {t('trips.t')}
                        </span>
                        {user && x.user_id === user.id && (
                          <form action={deleteTripAction.bind(null, x.id)}>
                            <button type="submit" className="min-h-9 rounded-lg px-2 text-xs text-anor-700 underline">{t('trips.cancel')}</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/trips?${new URLSearchParams({ product: String(first.product_id), tons: '1', from: first.from_district, market: String(first.market_id), date: first.trip_date })}#fellows`}
                    className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-firuza-700 hover:underline"
                  >
                    {t('trips.join')} →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {mine.length > 0 && <p className="mt-2 text-sm text-stone-600">{fill(t('trips.mine'), { n: mine.length })}</p>}
      </section>
    </div>
  );
}
