import Link from 'next/link';
import type { T } from '@/lib/i18n';
import type { BookingRow } from '@/lib/queries/bookings';
import { displayDate } from '@/lib/booking-rules';
import { formatPhone, telLink, whatsappLink } from '@/lib/phone';
import {
  cancelBookingAction,
  confirmBookingAction,
  rejectBookingAction,
  reviewAction,
} from '@/app/me/actions';

type TFn = T;

const STATUS_KEY = {
  pending: 'bk.pending',
  confirmed: 'bk.confirmed',
  rejected: 'bk.rejected',
  cancelled: 'bk.cancelled',
  done: 'bk.done',
} as const;

const btn = 'inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-3 text-sm font-medium';
const btnMain = 'inline-flex min-h-11 items-center rounded-lg bg-firuza-700 px-3 text-sm font-semibold text-white';

export default function BookingItem({
  b,
  role,
  t,
}: {
  b: BookingRow;
  role: 'renter' | 'owner';
  t: TFn;
}) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/equipment/${b.equipment_id}`} className="font-semibold underline">
          {b.title}
        </Link>
        {b.is_new && (
          <span className="rounded bg-anor-50 px-2 py-0.5 text-xs font-semibold text-anor-700">{t('bk.new')}</span>
        )}
      </div>
      <p className="mt-1 text-sm">
        {displayDate(b.start_date)} – {displayDate(b.end_date)} · <strong>{t(STATUS_KEY[b.status])}</strong>
      </p>
      <p className="text-sm text-stone-600">
        {role === 'renter' ? t('bk.owner') : t('bk.renter')}: {b.other_name}
      </p>
      {b.comment && <p className="mt-1 text-sm">{b.comment}</p>}

      {b.other_phone && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={telLink(b.other_phone)} className={btnMain}>
            {t('bk.call')} {formatPhone(b.other_phone)}
          </a>
          <a href={whatsappLink(b.other_phone)} className={btn} target="_blank" rel="noopener noreferrer">
            {t('bk.whatsapp')}
          </a>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {role === 'owner' && b.status === 'pending' && (
          <>
            <form action={confirmBookingAction}>
              <input type="hidden" name="id" value={b.id} />
              <button type="submit" className={btnMain}>{t('bk.confirm')}</button>
            </form>
            <form action={rejectBookingAction}>
              <input type="hidden" name="id" value={b.id} />
              <button type="submit" className={btn}>{t('bk.reject')}</button>
            </form>
          </>
        )}
        {role === 'renter' && (b.status === 'pending' || b.status === 'confirmed') && (
          <form action={cancelBookingAction}>
            <input type="hidden" name="id" value={b.id} />
            <button type="submit" className={btn}>{t('bk.cancel')}</button>
          </form>
        )}
      </div>

      {b.status === 'done' &&
        (b.reviewed ? (
          <p className="mt-3 text-sm">{t('bk.reviewed')}</p>
        ) : (
          <form action={reviewAction} className="mt-3 space-y-2">
            <input type="hidden" name="bookingId" value={b.id} />
            <label className="block text-sm font-medium" htmlFor={`rt-${b.id}`}>{t('bk.rating')}</label>
            <select
              id={`rt-${b.id}`}
              name="rating"
              defaultValue="5"
              className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-base"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <textarea
              name="comment"
              rows={2}
              maxLength={500}
              aria-label={t('bk.reviewComment')}
              placeholder={t('bk.reviewComment')}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base"
            />
            <button type="submit" className={btnMain}>{t('bk.reviewSend')}</button>
          </form>
        ))}
    </li>
  );
}