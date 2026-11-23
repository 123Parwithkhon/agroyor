import Link from 'next/link';
import { EquipmentCard } from '@/components/EquipmentCard';
import { OrnateHeading } from '@/components/ornaments';
import { DISTRICTS } from '@/lib/districts';
import { EQUIPMENT_TYPES, typeKey, type EquipmentType } from '@/lib/equipment';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { PAGE_SIZE, searchEquipment } from '@/lib/queries/equipment-search';
import { isWork, WORKS, workKey } from '@/lib/works';

export const generateMetadata = () => pageMetadata('page.equipment');

type SP = { type?: string; work?: string; district?: string; operator?: string; sort?: string; page?: string };

function isType(v: string | undefined): v is EquipmentType {
  return (EQUIPMENT_TYPES as readonly string[]).includes(v ?? '');
}

// Фильтры — обычная GET-форма: работают без JavaScript, адрес можно отправить другому
export default async function EquipmentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, t } = await getT();

  const type = isType(sp.type) ? sp.type : undefined;
  const work = isWork(sp.work) ? sp.work : undefined;
  const district = DISTRICTS.some((d) => d.code === sp.district) ? sp.district : undefined;
  const operator = sp.operator === '1';
  const sort = sp.sort === 'cheap' ? 'cheap' : 'new';
  const page = Math.max(1, Math.min(1000, Number.parseInt(sp.page ?? '1', 10) || 1));

  const { items, total } = await searchEquipment({ type, work, district, operator, sort, page });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (p: number) => {
    const q = new URLSearchParams();
    if (type) q.set('type', type);
    if (work) q.set('work', work);
    if (district) q.set('district', district);
    if (operator) q.set('operator', '1');
    if (sort === 'cheap') q.set('sort', 'cheap');
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return s ? `/equipment?${s}` : '/equipment';
  };

  const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';
  const pageBtn = 'inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-4 font-medium';

  return (
    <div className="flex flex-col gap-6">
      <OrnateHeading as="h1">{t('page.equipment')}</OrnateHeading>

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="search">
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
          {page > 1 ? <Link href={link(page - 1)} className={pageBtn}>{t('eq.prev')}</Link> : <span />}
          <span className="text-sm">{t('eq.page')} {Math.min(page, pages)} / {pages}</span>
          {page < pages ? <Link href={link(page + 1)} className={pageBtn}>{t('eq.next')}</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
