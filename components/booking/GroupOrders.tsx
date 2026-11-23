import Link from 'next/link';
import JoinGroupForm from '@/components/booking/JoinGroupForm';
import { GirihStar } from '@/components/ornaments';
import { joinGroupAction } from '@/app/equipment/[id]/actions';
import { displayDate } from '@/lib/booking-rules';
import { districtName } from '@/lib/districts';
import { formatAmount, formatMoney } from '@/lib/format';
import { groupProgress, shareCost } from '@/lib/group-rules';
import type { Lang, T } from '@/lib/i18n';
import type { OpenGroup } from '@/lib/queries/bookings';

type Props = {
  groups: OpenGroup[];
  equipmentId: number;
  pricePerHa: number;
  lang: Lang;
  t: T;
  /** null — гость; isOwner — владелец техники (видит сборы, но не присоединяется) */
  userId: string | null;
  isOwner: boolean;
  msgs: Record<string, string>;
};

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

/** «Совместный заказ»: прогресс сбора гектаров соседями и вступление в один клик. */
export function GroupOrders({ groups, equipmentId, pricePerHa, lang, t, userId, isOwner, msgs }: Props) {
  if (groups.length === 0) return null;
  return (
    <section className="rounded-2xl border-2 border-firuza-600 bg-firuza-50 p-4" aria-labelledby="group-title">
      <h2 id="group-title" className="flex items-center gap-2 text-xl font-bold text-lapis-900">
        <GirihStar className="size-5 text-anor-600" />
        {t('group.title')}
      </h2>
      <p className="mt-1 text-sm text-stone-700">{t('group.intro')}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {groups.map((g) => {
          const p = groupProgress(g.qty, g.joined, g.target);
          const members = 1 + g.joined.length;
          const canJoin = userId !== null && !isOwner && userId !== g.renter_id && g.my_area === null;
          return (
            <li key={g.id} className="rounded-xl border border-sand-200 bg-white p-4">
              <p className="font-semibold text-lapis-900">
                {fill(t('group.collected'), { collected: formatAmount(p.collected, lang), target: formatAmount(p.target, lang) })}{' '}
                <span className="font-normal text-stone-700">{t('group.in')} {districtName(g.district, lang)}</span>
              </p>
              {/* Полоса прогресса: доступна и для экранных читалок */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={p.percent}
                aria-label={t('group.title')}
                className="mt-2 h-3 overflow-hidden rounded-full bg-sand-100"
              >
                <div className={`h-full rounded-full ${p.reached ? 'bg-firuza-600' : 'bg-zar-500'}`} style={{ width: `${p.percent}%` }} />
              </div>
              <p className={`mt-1 text-sm font-medium ${p.reached ? 'text-firuza-800' : 'text-anor-700'}`}>
                {p.reached ? t('group.reached') : fill(t('group.left'), { left: formatAmount(p.left, lang) })}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {t('group.dates')}: {displayDate(g.start_date)} – {displayDate(g.end_date)} · {t('group.organizer')}: {g.organizer} ·{' '}
                {t('group.members')}: {members}
              </p>
              {g.my_area !== null && (
                <p className="mt-2 rounded-lg bg-firuza-50 p-2 text-sm font-semibold text-firuza-800">
                  {fill(t('group.joined'), {
                    area: formatAmount(g.my_area, lang),
                    cost: formatMoney(shareCost(g.my_area, pricePerHa), lang),
                  })}
                </p>
              )}
              {canJoin && (
                <JoinGroupForm
                  action={joinGroupAction.bind(null, String(equipmentId), g.id)}
                  msgs={msgs}
                  lang={lang}
                  pricePerHa={pricePerHa}
                  labels={{ area: t('group.area'), join: t('group.join'), share: t('group.yourShare'), joinedNotice: t('group.joinedNotice') }}
                />
              )}
              {userId === null && (
                <Link
                  href={`/login?next=${encodeURIComponent(`/equipment/${equipmentId}`)}`}
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-firuza-700 px-4 font-semibold text-white"
                >
                  {t('group.loginToJoin')}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
