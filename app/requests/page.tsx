import Link from 'next/link';
import { RequestCard } from '@/components/demand/RequestCard';
import { OrnateHeading } from '@/components/ornaments';
import { getCurrentUser } from '@/lib/auth-guards';
import { DEMAND_RADIUS_KM } from '@/lib/demand';
import { DISTRICTS } from '@/lib/districts';
import { EQUIPMENT_TYPES, typeKey, type EquipmentType } from '@/lib/equipment';
import { fill } from '@/lib/fill';
import { authMessages } from '@/lib/auth-messages';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { getNearbyRequests, getOpenRequests } from '@/lib/queries/demand';
import { respondAction } from './actions';
import Icon from '@/components/landing/Icon';

export const generateMetadata = () => pageMetadata('demand.listTitle');

type SP = { type?: string; district?: string; notice?: string; error?: string };

// Все открытые «кличи» фермеров. Владелец видит под запросом рядом со своей техникой кнопки отклика.
export default async function RequestsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, t } = await getT();
  const user = await getCurrentUser();
  const type = (EQUIPMENT_TYPES as readonly string[]).includes(sp.type ?? '') ? (sp.type as EquipmentType) : undefined;
  const district = DISTRICTS.some((d) => d.code === sp.district) ? sp.district : undefined;

  const list = await getOpenRequests({ type, district });
  const nearby = user ? await getNearbyRequests(user.id) : [];
  const byId = new Map(nearby.map((n) => [n.id, n]));
  const msgs: Record<string, string> = sp.error ? await authMessages() : {};
  const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <OrnateHeading as="h1">{t('demand.listTitle')}</OrnateHeading>
          <p className="mt-2 max-w-2xl text-stone-700">{fill(t('demand.listIntro'), { km: DEMAND_RADIUS_KM })}</p>
        </div>
        <Link href="/requests/new" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-anor-600 px-5 font-bold text-white hover:bg-anor-700">
          <Icon name="megaphone" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('demand.cta')}
        </Link>
      </div>

      {sp.notice === 'responded' && <p role="status" className="rounded-lg bg-firuza-50 p-3 text-sm font-semibold text-firuza-800">{t('demand.respondedNotice')}</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{msgs[sp.error] ?? msgs['err.generic']}</p>}

      <form className="grid gap-2 sm:grid-cols-3" role="search">
        <select name="type" defaultValue={type ?? ''} aria-label={t('eq.kind')} className={control}>
          <option value="">{t('eq.kind')}: {t('eq.filterAll')}</option>
          {EQUIPMENT_TYPES.map((k) => <option key={k} value={k}>{t(typeKey(k))}</option>)}
        </select>
        <select name="district" defaultValue={district ?? ''} aria-label={t('auth.district')} className={control}>
          <option value="">{t('auth.district')}: {t('eq.filterAll')}</option>
          {DISTRICTS.map((d) => <option key={d.code} value={d.code}>{d[lang]}</option>)}
        </select>
        <button type="submit" className="min-h-11 rounded-lg bg-firuza-700 px-4 font-semibold text-white">{t('eq.filterApply')}</button>
      </form>

      <section id="nearby">
        {list.length === 0 ? (
          <p className="rounded-xl border border-sand-200 bg-white p-5 text-center text-stone-600">{t('demand.empty')}</p>
        ) : (
          <ul className="grid gap-3">
            {list.map((r) => {
              const mine = byId.get(r.id);
              return (
                <RequestCard
                  key={r.id}
                  r={r}
                  lang={lang}
                  t={t}
                  options={mine?.options}
                  respond={(eqId) => respondAction.bind(null, r.id, eqId, 'requests')}
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
