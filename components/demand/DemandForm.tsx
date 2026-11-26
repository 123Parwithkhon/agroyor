'use client';

import { useActionState } from 'react';
import type { FormState } from '@/lib/form-state';
import Icon from '@/components/landing/Icon';

type Option = { value: string; label: string };

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  msgs: Record<string, string>;
  types: Option[];
  districts: Option[];
  today: string;
  maxDate: string;
  defaults: { type: string; district: string; needDate: string; area: string };
  labels: {
    type: string; district: string; needDate: string; area: string; budget: string; budgetHint: string;
    note: string; notePlaceholder: string; submit: string; hint: string;
  };
};

const control = 'min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base';

/** «Кинуть клич»: какая техника, где, когда, сколько гектаров и бюджет. Проверки — на сервере. */
export default function DemandForm({ action, msgs, types, districts, today, maxDate, defaults, labels }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const v = state?.values;
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);
  const err = (name: string) =>
    state?.fields?.[name] ? <p id={`d-${name}-err`} role="alert" className="text-sm text-anor-700">{m(state.fields[name])}</p> : null;
  const aria = (name: string) => (state?.fields?.[name] ? { 'aria-invalid': true, 'aria-describedby': `d-${name}-err` } : {});

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand-200 sm:grid-cols-2 sm:p-6">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700 sm:col-span-2">{m(state.error)}</p>
      )}
      <label className="grid gap-1 text-sm font-medium">
        {labels.type}
        <select name="type" defaultValue={v?.type ?? defaults.type} className={control} {...aria('type')}>
          {types.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {err('type')}
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {labels.district}
        <select name="district" defaultValue={v?.district ?? defaults.district} className={control} {...aria('district')}>
          {districts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {err('district')}
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {labels.needDate}
        <input type="date" name="needDate" min={today} max={maxDate} required
          defaultValue={v?.needDate ?? defaults.needDate} className={control} {...aria('needDate')} />
        {err('needDate')}
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {labels.area}
        <input name="area" inputMode="decimal" required defaultValue={v?.area ?? defaults.area} className={control} {...aria('area')} />
        {err('area')}
      </label>
      <label className="grid gap-1 text-sm font-medium sm:col-span-2">
        {labels.budget}
        <input name="budget" inputMode="decimal" defaultValue={v?.budget ?? ''} className={control} {...aria('budget')} />
        {state?.fields?.budget ? err('budget') : <span className="text-xs font-normal text-stone-500">{labels.budgetHint}</span>}
      </label>
      <label className="grid gap-1 text-sm font-medium sm:col-span-2">
        {labels.note}
        <textarea name="note" rows={2} maxLength={500} defaultValue={v?.note ?? ''} placeholder={labels.notePlaceholder}
          className="w-full rounded-xl border border-stone-300 bg-white p-3 text-base" {...aria('note')} />
        {err('note')}
      </label>
      <p className="text-sm text-stone-600 sm:col-span-2">{labels.hint}</p>
      <button type="submit" disabled={pending}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-anor-600 px-6 text-lg font-bold text-white hover:bg-anor-700 disabled:opacity-60 sm:col-span-2">
        <Icon name="megaphone" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{labels.submit}
      </button>
    </form>
  );
}
