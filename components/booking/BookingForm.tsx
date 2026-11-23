'use client';

import { useActionState, useState } from 'react';
import BookingCalendar from '@/components/booking/BookingCalendar';
import {
  daysInclusive, MAX_BOOKING_DAYS, parseQty, pickDate, rangeOverlaps, rentalCost, type DateRange,
} from '@/lib/booking-rules';
import type { CalendarLabels } from '@/lib/calendar-labels';
import type { FormState } from '@/lib/form-state';
import { formatAmount, formatMoney } from '@/lib/format';
import type { Lang } from '@/lib/i18n';

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  msgs: Record<string, string>;
  lang: Lang;
  today: string;
  price: number;
  /** Единица цены: день — считаем по датам; гектар и час — по введённому количеству */
  unit: 'day' | 'hectare' | 'hour';
  booked: DateRange[];
  calendar: CalendarLabels;
  labels: {
    start: string; end: string; comment: string; submit: string;
    calcTitle: string; qty: string; total: string; busy: string; note: string; pickHint: string;
    unitDays: string; unitHa: string; unitHours: string;
    calBusy: string; calFree: string; calSelected: string;
  };
};

const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';

/**
 * Заявка на бронь: выбор дат нажатием в календаре (или в полях дат) и мгновенный расчёт стоимости.
 * Расчёт — подсказка для фермера; сервер всё равно проверяет даты и пересечения сам.
 */
export default function BookingForm({ action, msgs, lang, today, price, unit, booked, calendar, labels }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [sel, setSel] = useState({ start: state?.values?.startDate ?? '', end: state?.values?.endDate ?? '' });
  const [qtyRaw, setQtyRaw] = useState(state?.values?.qty ?? '');
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);
  const f = state?.fields;

  const days = sel.start && sel.end ? daysInclusive(sel.start, sel.end) : null;
  const validRange = days !== null && days > 0;
  const busy = validRange && rangeOverlaps(sel.start, sel.end, booked);
  const tooLong = validRange && days > MAX_BOOKING_DAYS;
  const qty = unit === 'day' ? (validRange ? days : null) : parseQty(qtyRaw);
  const qtyBad = unit !== 'day' && qtyRaw.trim() !== '' && qty === null;
  const total = qty !== null && !busy && !tooLong ? rentalCost(qty, price) : null;
  const unitLabel = unit === 'day' ? labels.unitDays : unit === 'hectare' ? labels.unitHa : labels.unitHours;

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-sand-200 bg-white p-4">
        <p className="text-sm text-stone-600">{labels.pickHint}</p>
        <BookingCalendar
          labels={calendar}
          booked={booked}
          today={today}
          text={{ busy: labels.calBusy, free: labels.calFree, selected: labels.calSelected }}
          selected={sel}
          onPick={(d) => setSel((s) => pickDate(s, d))}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-sand-200 bg-white p-4">
        {state?.error && (
          <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{m(state.error)}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="f-startDate" className="block text-sm font-medium">{labels.start}</label>
            <input id="f-startDate" name="startDate" type="date" min={today} required value={sel.start}
              onChange={(e) => setSel((s) => ({ start: e.target.value, end: s.end && s.end < e.target.value ? '' : s.end }))}
              className={control} />
          </div>
          <div className="space-y-1">
            <label htmlFor="f-endDate" className="block text-sm font-medium">{labels.end}</label>
            <input id="f-endDate" name="endDate" type="date" min={sel.start || today} required value={sel.end}
              onChange={(e) => setSel((s) => ({ ...s, end: e.target.value }))} className={control} />
          </div>
        </div>
        {(f?.startDate || f?.endDate) && (
          <p role="alert" className="text-sm text-anor-700">{m(f.startDate ?? f.endDate)}</p>
        )}

        {unit !== 'day' && (
          <div className="space-y-1">
            <label htmlFor="f-qty" className="block text-sm font-medium">{labels.qty}</label>
            <input id="f-qty" name="qty" type="text" inputMode="decimal" value={qtyRaw}
              onChange={(e) => setQtyRaw(e.target.value)} className={control} aria-invalid={qtyBad} />
            {qtyBad && <p role="alert" className="text-sm text-anor-700">{m('err.qtyInvalid')}</p>}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="f-comment" className="block text-sm font-medium">{labels.comment}</label>
          <textarea id="f-comment" name="comment" rows={3} maxLength={500}
            defaultValue={state?.values?.comment}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base" />
        </div>

        {/* Расчёт стоимости обновляется сразу при выборе дат или вводе площади */}
        <div className="rounded-lg border-2 border-zar-300 bg-zar-50 p-3" aria-live="polite">
          <p className="text-sm font-semibold text-lapis-900">{labels.calcTitle}</p>
          {busy && <p role="alert" className="mt-1 text-sm font-medium text-anor-700">{labels.busy}</p>}
          {tooLong && <p role="alert" className="mt-1 text-sm font-medium text-anor-700">{m('err.datesTooLong')}</p>}
          {total !== null && qty !== null && (
            <p className="mt-1 text-lg tabular-nums">
              {formatAmount(qty, lang)} {unitLabel} × {formatMoney(price, lang)} ={' '}
              <strong className="text-firuza-800">{formatMoney(total, lang)}</strong>
            </p>
          )}
          <p className="mt-1 text-xs text-stone-600">{labels.note}</p>
        </div>

        <button type="submit" disabled={pending || busy || tooLong}
          className="min-h-12 w-full rounded-lg bg-firuza-700 px-4 font-semibold text-white disabled:opacity-60">
          {labels.submit}
        </button>
      </div>
    </form>
  );
}
