import Link from 'next/link';
import DemandForm from '@/components/demand/DemandForm';
import { OrnateHeading } from '@/components/ornaments';
import { requireUser } from '@/lib/auth-guards';
import { authMessages } from '@/lib/auth-messages';
import { DEMAND_MAX_DAYS_AHEAD, DEMAND_RADIUS_KM } from '@/lib/demand';
import { DISTRICTS } from '@/lib/districts';
import { EQUIPMENT_TYPES, typeKey } from '@/lib/equipment';
import { fill } from '@/lib/fill';
import { todayInDushanbe } from '@/lib/format';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { shiftDate } from '@/lib/prices-rules';
import { getUserDistrict } from '@/lib/queries/user';
import { createRequestAction } from '../actions';

export const generateMetadata = () => pageMetadata('demand.newTitle');

type SP = { type?: string; district?: string; area?: string; date?: string };

// «Кинуть клич владельцам техники в районе»: из пустого каталога, из подбора комплекса или из кабинета.
export default async function NewRequestPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === 'string'));
  const user = await requireUser(`/requests/new${q.size ? `?${q}` : ''}`);
  const { lang, t } = await getT();
  const today = todayInDushanbe();
  const home = await getUserDistrict(user.id);

  const type = (EQUIPMENT_TYPES as readonly string[]).includes(sp.type ?? '') ? sp.type! : 'harvester';
  const district = DISTRICTS.some((d) => d.code === sp.district) ? sp.district! : (home ?? 'khujand');

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <Link href="/requests" className="text-sm font-medium text-firuza-700 hover:underline">← {t('demand.listTitle')}</Link>
        <OrnateHeading as="h1">{t('demand.newTitle')}</OrnateHeading>
        <p className="mt-2 text-stone-700">{fill(t('demand.newIntro'), { km: DEMAND_RADIUS_KM })}</p>
      </div>
      <DemandForm
        action={createRequestAction}
        msgs={await authMessages()}
        types={EQUIPMENT_TYPES.map((k) => ({ value: k, label: t(typeKey(k)) }))}
        districts={DISTRICTS.map((d) => ({ value: d.code, label: d[lang] }))}
        today={today}
        maxDate={shiftDate(today, DEMAND_MAX_DAYS_AHEAD)}
        defaults={{ type, district, needDate: sp.date && sp.date >= today ? sp.date : shiftDate(today, 3), area: sp.area ?? '' }}
        labels={{
          type: t('demand.type'), district: t('demand.district'), needDate: t('demand.date'), area: t('demand.area'),
          budget: t('demand.budget'), budgetHint: t('demand.budgetHint'), note: t('demand.note'),
          notePlaceholder: t('demand.notePlaceholder'), submit: t('demand.submit'), hint: fill(t('demand.hint'), { km: DEMAND_RADIUS_KM }),
        }}
      />
    </div>
  );
}
