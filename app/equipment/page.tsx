import Link from 'next/link';
import { EquipmentCard } from '@/components/EquipmentCard';
import EquipmentMap, { type MapMarket, type MapPoint } from '@/components/map/EquipmentMap';
import { OrnateHeading } from '@/components/ornaments';
import { DISTRICTS, type DistrictCode } from '@/lib/districts';
import { EQUIPMENT_TYPES, priceUnitKey, typeKey, type EquipmentType } from '@/lib/equipment';
import { formatMoney, todayInDushanbe } from '@/lib/format';
import { DEFAULT_RADIUS_KM, DISTRICT_CENTERS, jitter, marketPoint } from '@/lib/geo';
import { localizedName } from '@/lib/i18n';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { PAGE_SIZE, searchEquipment, searchEquipmentForMap } from '@/lib/queries/equipment-search';
import { getPriceBoard } from '@/lib/queries/prices';
import { isWork, WORKS, workKey } from '@/lib/works';

export const generateMetadata = () => pageMetadata('page.equipment');

type SP = { type?: string; work?: string; district?: string; operator?: string; sort?: string; page?: string; view?: string };

function isType(v: string | undefined): v is EquipmentType {
  return (EQUIPMENT_TYPES as readonly string[]).includes(v ?? '');
}

// Фильтры — обычная GET-форма: работают без JavaScript, адрес можно отправить другому.
// Вид «Карта» (?view=map) показывает ту же выборку на карте Согда.
export default async function EquipmentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, t } = await getT();

  const type = isType(sp.type) ? sp.type : undefined;
  const work = isWork(sp.work) ? sp.work : undefined;
  const district = DISTRICTS.some((d) => d.code === sp.district) ? sp.district : undefined;
  const operator = sp.operator === '1';
  const sort = sp.sort === 'cheap' ? 'cheap' : 'new';
  const page = Math.max(1, Math.min(1000, Number.parseInt(sp.page ?? '1', 10) || 1));
  const mapView = sp.view === 'map';

  const link = (p: number, view: 'list' | 'map' = mapView ? 'map' : 'list') => {
    const q = new URLSearchParams();
    if (type) q.set('type', type);
    if (work) q.set('work', work);
    if (district) q.set('district', district);
    if (operator) q.set('operator', '1');
    if (sort === 'cheap') q.set('sort', 'cheap');
    if (view === 'map') q.set('view', 'map');
    if (p > 1 && view === 'list') q.set('page', String(p));
    const s = q.toString();
    return s ? `/equipment?${s}` : '/equipment';
  };

  const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';
  const pageBtn = 'inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-4 font-medium';
  const tab = (active: boolean) =>
    `inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border px-4 font-semibold sm:flex-none ${
      active ? 'border-firuza-700 bg-firuza-700 text-white' : 'border-stone-300 bg-white text-stone-800'
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrnateHeading as="h1">{t('page.equipment')}</OrnateHeading>
        <nav className="flex w-full gap-2 sm:w-auto" aria-label={t('map.view')}>
          <Link href={link(1, 'list')} className={tab(!mapView)} aria-current={!mapView ? 'page' : undefined}>
            {t('map.list')}
          </Link>
          <Link href={link(1, 'map')} className={tab(mapView)} aria-current={mapView ? 'page' : undefined}>
            {t('map.map')}
          </Link>
        </nav>
      </div>

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="search">
        {mapView && <input type="hidden" name="view" value="map" />}
        {/* Вид работ — первым: фермеру проще искать по задаче, чем по модели техники */}
        <select name="work" defaultValue={work ?? ''} aria-label={t('eq.work')} className={control}>
          <option value="">{t('eq.work')}: {t('eq.filterAll')}</option>
          {WORKS.map((w) => (
            <option key={w} value={w}>{t(workKey(w))}</option>
          ))}
        </select>
        <select name="type" defaultValue={type ?? ''} aria-label={t('eq.kind')} className={control}>
          <option value="">{t('eq.kind')}: {t('eq.filterAll')}</option>
          {EQUIPMENT_TYPES.map((k) => (
            <option key={k} value={k}>{t(typeKey(k))}</option>
          ))}
        </select>
        <select name="district" defaultValue={district ?? ''} aria-label={t('auth.district')} className={control}>
          <option value="">{t('auth.district')}: {t('eq.filterAll')}</option>
          {DISTRICTS.map((d) => (
            <option key={d.code} value={d.code}>{d[lang]}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label={t('eq.sort')} className={control}>
          <option value="new">{t('eq.sortNew')}</option>
          <option value="cheap">{t('eq.sortCheap')}</option>
        </select>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="operator" value="1" defaultChecked={operator} className="size-5" />
          <span>{t('eq.withOperator')}</span>
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-firuza-700 px-4 font-semibold text-white hover:bg-firuza-800 sm:col-span-2 lg:col-span-5"
        >
          {t('eq.filterApply')}
        </button>
      </form>

      {mapView ? (
        <MapSection type={type} work={work} district={district} operator={operator} />
      ) : (
        <ListSection type={type} work={work} district={district} operator={operator} sort={sort} page={page} link={link} pageBtn={pageBtn} />
      )}
    </div>
  );

  async function ListSection(p: {
    type?: EquipmentType; work?: (typeof WORKS)[number]; district?: string; operator: boolean;
    sort: 'new' | 'cheap'; page: number; link: (p: number) => string; pageBtn: string;
  }) {
    const { items, total } = await searchEquipment(p);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return (
      <>
        {items.length === 0 ? (
          <p className="rounded-xl border border-sand-200 bg-white p-5 text-center text-stone-600">{t('eq.noResults')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <EquipmentCard key={it.id} item={it} lang={lang} t={t} />
            ))}
          </div>
        )}
        {pages > 1 && (
          <nav className="flex items-center justify-between gap-3" aria-label={t('eq.page')}>
            {p.page > 1 ? <Link href={p.link(p.page - 1)} className={p.pageBtn}>{t('eq.prev')}</Link> : <span />}
            <span className="text-sm">{t('eq.page')} {Math.min(p.page, pages)} / {pages}</span>
            {p.page < pages ? <Link href={p.link(p.page + 1)} className={p.pageBtn}>{t('eq.next')}</Link> : <span />}
          </nav>
        )}
      </>
    );
  }

  async function MapSection(f: { type?: EquipmentType; work?: (typeof WORKS)[number]; district?: string; operator: boolean }) {
    // Последовательно: локальная PGlite работает через одно соединение
    const items = await searchEquipmentForMap(f);
    const board = await getPriceBoard(todayInDushanbe());

    const points: MapPoint[] = items.flatMap((it) => {
      const center = DISTRICT_CENTERS[it.district as DistrictCode];
      if (!center) return [];
      return [{
        id: it.id,
        at: jitter(center, it.id),
        title: it.title,
        typeLabel: t(typeKey(it.type)),
        priceText: `${formatMoney(it.price, lang)} / ${t(priceUnitKey(it.price_unit))}`,
        radiusKm: it.service_radius_km ?? DEFAULT_RADIUS_KM,
        href: `/equipment/${it.id}`,
      }];
    });
    const located = board.markets
      .map((m) => ({ m, at: marketPoint([m.name_tj, m.name_ru, m.name_en]) }))
      .filter((x): x is { m: (typeof board.markets)[number]; at: [number, number] } => x.at !== null);
    const markets: MapMarket[] = located.map(({ m, at }) => ({ name: localizedName(m, lang), at }));
    const prices: Record<number, (string | null)[]> = {};
    for (const row of board.rows) {
      prices[row.product.id] = located.map(({ m }) => {
        const v = row.cells[m.id]?.price;
        return v == null ? null : formatMoney(v, lang);
      });
    }

    return (
      <section aria-label={t('map.map')}>
        <p className="mb-2 text-sm font-medium text-stone-700">{t('map.found')}: {points.length}</p>
        <EquipmentMap
          points={points}
          markets={markets}
          products={board.rows.map((r) => ({ id: r.product.id, name: localizedName(r.product, lang) }))}
          prices={prices}
          labels={{ priceOf: t('map.priceOf'), open: t('map.open'), error: t('map.error'), approx: t('map.approx') }}
        />
      </section>
    );
  }
}
