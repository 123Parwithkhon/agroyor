import Link from 'next/link';
import { OrnateHeading } from '@/components/ornaments';
import { requireUser } from '@/lib/auth-guards';
import { priceUnitKey } from '@/lib/equipment';
import { formatMoney } from '@/lib/format';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { getMyEquipment } from '@/lib/queries/equipment-manage';
import { toggleActiveAction } from './actions';

export const generateMetadata = () => pageMetadata('page.myEquipment');

export default async function MyEquipmentPage() {
  const user = await requireUser('/me/equipment');
  const { lang, t } = await getT();
  const items = await getMyEquipment(user.id);

  const btn = 'inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <OrnateHeading as="h1">{t('eq.my')}</OrnateHeading>
      <Link
        href="/me/equipment/new"
        className="flex min-h-14 items-center justify-center rounded-xl bg-firuza-700 px-4 font-semibold text-white hover:bg-firuza-800 sm:self-start"
      >
        {t('eq.add')}
      </Link>

      {items.length === 0 ? (
        <p className="rounded-xl border border-sand-200 bg-white p-5 text-center text-stone-600">{t('eq.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="rounded-xl border border-sand-200 bg-white p-4">
              <Link href={`/equipment/${it.id}`} className="font-semibold text-lapis-900 underline-offset-2 hover:underline">
                {it.title}
              </Link>
              <p className="text-sm text-stone-600">
                {formatMoney(it.price, lang)} / {t(priceUnitKey(it.price_unit))}
              </p>
              <p className="mt-1 text-sm">
                {it.active ? t('eq.active') : t('eq.inactive')}
                {it.hidden_by_admin && (
                  <span className="ml-2 rounded bg-anor-50 px-2 py-0.5 text-xs text-anor-700">
                    {t('eq.hiddenByAdmin')}
                  </span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/me/equipment/${it.id}/edit`} className={btn}>
                  {t('eq.edit')}
                </Link>
                <form action={toggleActiveAction}>
                  <input type="hidden" name="id" value={it.id} />
                  <button type="submit" className={btn}>
                    {it.active ? t('eq.disable') : t('eq.enable')}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
