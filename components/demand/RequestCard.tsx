import { PinIcon } from '@/components/icons';
import { districtName } from '@/lib/districts';
import { priceUnitKey, typeKey } from '@/lib/equipment';
import { fill } from '@/lib/fill';
import { formatDate, formatMoney } from '@/lib/format';
import { num } from '@/lib/duration';
import type { Lang, T } from '@/lib/i18n';
import type { DemandRequest, OwnerEquipment } from '@/lib/queries/demand';
import Icon from '@/components/landing/Icon';

type Props = {
  r: DemandRequest;
  lang: Lang;
  t: T;
  /** Моя техника для отклика в один клик (у владельца) */
  options?: { equipment: OwnerEquipment; responded: boolean }[];
  respond?: (equipmentId: string) => (formData: FormData) => Promise<void>;
  isNew?: boolean;
};

/** Карточка «клича»: что нужно, где, когда, площадь, бюджет; у владельца — кнопки отклика. */
export function RequestCard({ r, lang, t, options, respond, isNew }: Props) {
  return (
    <li className="rounded-2xl border-s-4 border-anor-600 bg-white p-4 shadow-sm ring-1 ring-sand-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-bold text-lapis-900">
          <Icon name="megaphone" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t(typeKey(r.type))} · {num(r.area_ha, lang)} {t('demand.ha')}
          {isNew && <span className="ms-2 rounded-full bg-anor-600 px-2 py-0.5 align-middle text-xs text-white">{t('demand.new')}</span>}
        </p>
        <p className="rounded-full bg-sand-100 px-3 py-1 text-sm font-semibold text-lapis-800">{formatDate(r.need_date, lang)}</p>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-700">
        <span className="inline-flex items-center gap-1">
          <PinIcon className="size-4 text-anor-600" />
          {districtName(r.district, lang)}
        </span>
        {r.budget_per_ha !== null && (
          <span>{t('demand.budgetShort')}: <b>{formatMoney(r.budget_per_ha, lang)}/{t('priceUnit.hectare')}</b></span>
        )}
        {r.author && <span>{r.author}</span>}
        <span className="text-stone-500">{fill(t('demand.responses'), { n: r.responses })}</span>
      </p>
      {r.note && <p className="mt-2 text-sm text-stone-700">«{r.note}»</p>}
      {options && respond && options.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map(({ equipment: e, responded }) =>
            responded ? (
              <span key={e.id} className="inline-flex min-h-11 items-center rounded-xl bg-firuza-50 px-3 text-sm font-semibold text-firuza-800">
                <Icon name="check" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{fill(t('demand.responded'), { title: e.title })}
              </span>
            ) : (
              <form key={e.id} action={respond(e.id)}>
                <button type="submit" className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-firuza-700 px-3 text-sm font-semibold text-white hover:bg-firuza-800">
                  {fill(t('demand.respond'), { title: e.title })}
                  <span className="font-normal opacity-90">· {formatMoney(e.price, lang)}/{t(priceUnitKey(e.price_unit))}</span>
                </button>
              </form>
            ),
          )}
        </div>
      )}
    </li>
  );
}
