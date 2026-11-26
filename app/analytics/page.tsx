import Link from 'next/link';
import LoadHeatMap, { LOAD_COLORS, type HeatDistrict } from '@/components/map/LoadHeatMap';
import { OrnateHeading } from '@/components/ornaments';
import { districtName, type DistrictCode } from '@/lib/districts';
import { typeKey, type EquipmentType } from '@/lib/equipment';
import { fill } from '@/lib/fill';
import { formatAmount, formatMoney } from '@/lib/format';
import { DISTRICT_CENTERS } from '@/lib/geo';
import type { DictKey } from '@/lib/i18n';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { BASELINE_KM, CO2_KG_PER_L, DIESEL_TJS_PER_L, FUEL_L_PER_KM } from '@/lib/impact';
import { getRegionAnalytics, LOAD_PERIOD_DAYS } from '@/lib/queries/analytics';
import Icon, { type IconName } from '@/components/landing/Icon';

export const generateMetadata = () => pageMetadata('an.title');
// Свежие цифры при каждом открытии (страницу показывают на презентации)
export const dynamic = 'force-dynamic';

// «Аналитика региона» (B2B-вид для доноров, хукуматов, джамоатов и кооперативов):
// счётчики экономии и CO₂, тепловая карта загруженности техники по районам, дефицит и простой.
export default async function AnalyticsPage() {
  const { lang, t } = await getT();
  const a = await getRegionAnalytics();
  const n = (v: number) => formatAmount(v, lang);

  const heat: HeatDistrict[] = a.districts.map((d) => ({
    name: districtName(d.district, lang),
    at: DISTRICT_CENTERS[d.district as DistrictCode],
    machines: d.machines,
    percent: d.percent,
    level: d.level,
    demand: d.demand,
    openRequests: d.openRequests,
    details: (Object.entries(d.byType) as [EquipmentType, number][]).map(([k, c]) => `${t(typeKey(k))} ×${c}`).join(', '),
  }));
  const shown = a.districts.filter((d) => d.machines > 0 || d.demand > 0).sort((x, y) => y.machines - x.machines || y.demand - x.demand);

  const counters = [
    { value: a.impact.co2Kg >= 1000 ? `${formatAmount(Math.round(a.impact.co2Kg / 100) / 10, lang)} ${t('an.tons')}` : `${n(a.impact.co2Kg)} ${t('an.kg')}`, label: t('an.co2'), icon: 'leaf' as IconName },
    { value: formatMoney(a.impact.moneySaved, lang), label: t('an.money'), icon: 'coins' as IconName },
    { value: `${n(a.impact.kmSaved)} ${t('an.km')}`, label: t('an.kmSaved'), icon: 'road' as IconName },
    { value: n(a.impact.farms), label: t('an.farms'), icon: 'users' as IconName },
  ];
  const levels: HeatDistrict['level'][] = ['idle', 'low', 'normal', 'high'];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-anor-700">{t('an.eyebrow')}</p>
        <OrnateHeading as="h1">{t('an.title')}</OrnateHeading>
        <p className="mt-2 max-w-3xl text-stone-700">{t('an.intro')}</p>
      </div>

      {/* Счётчики: зелёное и климатическое финансирование */}
      <section className="hero-sky on-dark rounded-3xl p-5 text-white shadow-xl sm:p-8" aria-label={t('an.impactTitle')}>
        <p className="text-sm font-semibold uppercase tracking-wide text-zar-300">{t('an.impactTitle')}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {counters.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
              <dt className="text-sm text-lapis-100/90">
                <Icon name={c.icon} className="me-1.5 inline-block size-[1.1em] align-[-0.15em]" />
                {c.label}
              </dt>
              <dd className="mt-1 text-2xl font-extrabold tabular-nums text-zar-300 sm:text-3xl">{c.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-lapis-100/80">
          {fill(t('an.impactText'), { bookings: a.impact.bookings, liters: n(a.impact.litersSaved), ha: formatAmount(a.hectares, lang) })}
        </p>
      </section>

      {/* Тепловая карта загруженности */}
      <section className="flex flex-col gap-3">
        <OrnateHeading>{t('an.mapTitle')}</OrnateHeading>
        <p className="text-stone-700">{fill(t('an.mapText'), { days: LOAD_PERIOD_DAYS })}</p>
        <ul className="flex flex-wrap gap-3 text-sm">
          {levels.map((l) => (
            <li key={l} className="inline-flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-full" style={{ background: LOAD_COLORS[l] }} aria-hidden="true" />
              {t(`an.level.${l}` as DictKey)}
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-full border-2 border-dashed border-rose-700" aria-hidden="true" />
            {t('an.shortageRing')}
          </li>
        </ul>
        <LoadHeatMap
          districts={heat}
          labels={{
            machines: t('an.machines'), load: t('an.load'), demand: t('an.demand'), requests: t('an.requests'),
            error: t('map.error'), shortage: t('an.shortageRing'),
          }}
        />
        <div className="relative overflow-x-auto rounded-2xl bg-white ring-1 ring-sand-200">
          <table className="w-full min-w-[30rem] text-sm">
            <caption className="sr-only">{t('an.mapTitle')}</caption>
            <thead className="bg-lapis-900 text-left text-white">
              <tr>
                <th scope="col" className="p-3">{t('auth.district')}</th>
                <th scope="col" className="p-3 text-right">{t('an.machines')}</th>
                <th scope="col" className="p-3 text-right">{t('an.load')}</th>
                <th scope="col" className="p-3 text-right">{t('an.demand')}</th>
                <th scope="col" className="p-3 text-right">{t('an.requests')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.district} className="border-t border-sand-100 even:bg-sand-50">
                  <th scope="row" className="p-3 text-left font-semibold">
                    <span className="me-2 inline-block size-2.5 rounded-full align-middle" style={{ background: LOAD_COLORS[d.level] }} aria-hidden="true" />
                    {districtName(d.district, lang)}
                  </th>
                  <td className="p-3 text-right tabular-nums">{d.machines}</td>
                  <td className="p-3 text-right tabular-nums">{d.machines ? `${d.percent}%` : '—'}</td>
                  <td className="p-3 text-right tabular-nums">{d.demand}</td>
                  <td className={`p-3 text-right tabular-nums ${d.openRequests ? 'font-bold text-anor-700' : ''}`}>{d.openRequests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Дефицит и простой */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border-t-4 border-anor-600 bg-white p-5 ring-1 ring-sand-200">
          <h2 className="text-lg font-bold text-lapis-900"><Icon name="flame" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('an.shortTitle')}</h2>
          {a.shortages.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">{t('an.shortNone')}</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {a.shortages.map((g) => (
                <li key={`${g.district}-${g.type}`} className="rounded-xl bg-anor-50 p-3 text-sm">
                  {fill(t('an.shortItem'), {
                    district: districtName(g.district, lang),
                    type: t(typeKey(g.type as EquipmentType)).toLowerCase(),
                    demand: g.demand,
                    supply: g.supply,
                  })}
                </li>
              ))}
            </ul>
          )}
          <Link href="/me/equipment/new" className="mt-3 inline-flex min-h-11 items-center font-semibold text-firuza-700 hover:underline">
            {t('an.shortCta')} →
          </Link>
        </div>
        <div className="rounded-2xl border-t-4 border-stone-400 bg-white p-5 ring-1 ring-sand-200">
          <h2 className="text-lg font-bold text-lapis-900"><Icon name="moon" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('an.idleTitle')}</h2>
          {a.idle.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">{t('an.idleNone')}</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {a.idle.map((x) => (
                <li key={`${x.district}-${x.type}`} className="rounded-xl bg-sand-50 p-3 text-sm">
                  {fill(t('an.idleItem'), {
                    district: districtName(x.district, lang),
                    type: t(typeKey(x.type)).toLowerCase(),
                    n: x.machines,
                    days: 30,
                  })}{' '}
                  <Link href={`/equipment?type=${x.type}&district=${x.district}`} className="font-semibold text-firuza-700 underline">
                    {t('an.idleRent')}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { v: a.totals.machines, l: t('an.totMachines') },
          { v: a.totals.owners, l: t('an.totOwners') },
          { v: a.totals.bookings, l: t('an.totBookings') },
          { v: a.totals.requests, l: t('an.totRequests') },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl bg-white p-4 text-center ring-1 ring-sand-200">
            <p className="text-3xl font-extrabold text-lapis-900 tabular-nums">{x.v}</p>
            <p className="text-sm text-stone-600">{x.l}</p>
          </div>
        ))}
      </section>

      <details className="rounded-2xl bg-white p-5 text-sm text-stone-700 ring-1 ring-sand-200">
        <summary className="cursor-pointer font-semibold text-lapis-900">{t('an.methodTitle')}</summary>
        <p className="mt-2 leading-relaxed">
          {fill(t('an.method'), {
            baseline: BASELINE_KM,
            fuel: String(FUEL_L_PER_KM).replace('.', lang === 'en' ? '.' : ','),
            diesel: DIESEL_TJS_PER_L,
            co2: String(CO2_KG_PER_L).replace('.', lang === 'en' ? '.' : ','),
          })}
        </p>
      </details>
    </div>
  );
}
