import Link from 'next/link';
import { PhoneIcon } from '@/components/icons';
import { districtName } from '@/lib/districts';
import { num } from '@/lib/duration';
import { priceUnitKey, typeKey } from '@/lib/equipment';
import { fill } from '@/lib/fill';
import { formatDate, formatMoney } from '@/lib/format';
import type { Lang, T } from '@/lib/i18n';
import { formatPhone, telLink } from '@/lib/phone';
import type { MyRequest } from '@/lib/queries/demand';
import Icon from '@/components/landing/Icon';

type Props = { list: MyRequest[]; lang: Lang; t: T; close: (id: string) => () => Promise<void> };

/** Мои «кличи» и отклики владельцев: телефон, цена, ссылка на технику для брони. */
export function MyRequests({ list, lang, t, close }: Props) {
  if (list.length === 0) return <p className="mt-3 text-sm text-stone-600">{t('demand.myEmpty')}</p>;
  return (
    <ul className="mt-3 grid gap-3">
      {list.map((r) => (
        <li key={r.id} className={`rounded-2xl bg-white p-4 ring-1 ring-sand-200 ${r.closed ? 'opacity-60' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-lapis-900">
              {t(typeKey(r.type))} · {num(r.area_ha, lang)} {t('demand.ha')} · {districtName(r.district, lang)} ·{' '}
              {formatDate(r.need_date, lang)}
            </p>
            {r.closed ? (
              <span className="text-sm text-stone-500">{t('demand.closed')}</span>
            ) : (
              <form action={close(r.id)}>
                <button type="submit" className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm font-medium">
                  {t('demand.close')}
                </button>
              </form>
            )}
          </div>
          {r.offers.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">{r.closed ? t('demand.noOffersClosed') : t('demand.waiting')}</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {r.offers.map((o) => (
                <li key={o.equipment_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-firuza-50 p-3">
                  <div>
                    <p className="font-semibold text-lapis-900">
                      {o.is_new && <span className="me-2 rounded-full bg-anor-600 px-2 py-0.5 text-xs text-white">{t('demand.new')}</span>}
                      <Link href={`/equipment/${o.equipment_id}`} className="underline underline-offset-2">{o.title}</Link>
                    </p>
                    <p className="text-sm text-stone-700">
                      {o.owner} · {districtName(o.district, lang)} ·{' '}
                      <b>{formatMoney(o.price, lang)}/{t(priceUnitKey(o.price_unit))}</b>
                      {r.budget_per_ha !== null && o.price_unit === 'hectare' && o.price <= r.budget_per_ha && (
                        <span className="ms-1 text-firuza-800"><Icon name="check" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('demand.inBudget')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={telLink(o.phone)} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-firuza-700 px-3 text-sm font-semibold text-white">
                      <PhoneIcon className="size-4" /> {formatPhone(o.phone)}
                    </a>
                    <Link href={`/equipment/${o.equipment_id}`} className="inline-flex min-h-11 items-center rounded-xl border-2 border-firuza-700 px-3 text-sm font-semibold text-firuza-800">
                      {t('match.book')}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!r.closed && r.offers.length > 0 && (
            <p className="mt-2 text-xs text-stone-500">{fill(t('demand.offersCount'), { n: r.offers.length })}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
