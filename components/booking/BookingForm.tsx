'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '@/lib/form-state';
import { daysInclusive, rangeOverlaps, type DateRange } from '@/lib/booking-rules';
import { formatMoney } from '@/lib/format';

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  msgs: Record<string, string>;
  today: string;
  price: number;
  mode: 'day' | 'ha' | 'hour';
  booked: DateRange[];
  labels: {
    start: string; end: string; comment: string; submit: string;
    calcTitle: string; calcDays: string; qty: string; total: string; busy: string; note: string;
  };
};

const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';

export default function BookingForm({ action, msgs, today, price, mode, booked, labels }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [start, setStart] = useState(state?.values?.startDate ?? '');
  const [end, setEnd] = useState(state?.values?.endDate ?? '');
  const [qtyRaw, setQtyRaw] = useState('');
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);
  const f = state?.fields;

  const days = start && end ? daysInclusive(start, end) : null;
  const validRange = days !== null && days > 0;
  const busy = validRange && rangeOverlaps(start, end, booked);
  const qty = mode === 'day' ? (validRange ? days : 0) : Number(qtyRaw.replace(',', '.')) || 0;
  const total = qty > 0 ? Math.round(qty * price * 100) / 100 : null;
  const qtyUnit = mode === 'day' ? labels.calcDays : '';

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{m(state.error)}</p>
      )}
      <div className="space-y-1">
        <label htmlFor="f-startDate" className="block text-sm font-medium">{labels.start}</label>
        <input id="f-startDate" name="startDate" type="date" min={today} required value={start}
          onChange={(e) => setStart(e.target.value)} className={control} />
        {f?.startDate && <p role="alert" className="text-sm text-anor-700">{m(f.startDate)}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor="f-endDate" className="block text-sm font-medium">{labels.end}</label>
        <input id="f-endDate" name="endDate" type="date" min={start || today} required value={end}
          onChange={(e) => setEnd(e.target.value)} className={control} />
        {f?.endDate && <p role="alert" className="text-sm text-anor-700">{m(f.endDate)}</p>}
      </div>

      {mode !== 'day' && (
        <div className="space-y-1">
          <label htmlFor="f-qty" className="block text-sm font-medium">{labels.qty}</label>
          <input id="f-qty" type="text" inputMode="decimal" value={qtyRaw}
            onChange={(e) => setQtyRaw(e.target.value)} className={control} />
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="f-comment" className="block text-sm font-medium">{labels.comment}</label>
        <textarea id="f-comment" name="comment" rows={3} maxLength={500}
          defaultValue={state?.values?.comment}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base" />
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-3" aria-live="polite">
        <p className="text-sm font-semibold">{labels.calcTitle}</p>
        {busy && <p role="alert" className="mt-1 text-sm font-medium text-anor-700">{labels.busy}</p>}
        {total !== null && !busy && (
          <p className="mt-1 text-lg">
            {qty} {qtyUnit} × {formatMoney(price)} = <strong>{formatMoney(total)}</strong>
          </p>
        )}
        <p className="mt-1 text-xs text-stone-600">{labels.note}</p>
      </div>

      <button type="submit" disabled={pending || busy}
        className="min-h-11 w-full rounded-lg bg-firuza-700 px-4 font-semibold text-white disabled:opacity-60">
        {labels.submit}
      </button>
    </form>
  );
}