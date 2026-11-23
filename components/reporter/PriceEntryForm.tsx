'use client';

import { useActionState } from 'react';
import type { FormState } from '@/lib/form-state';

type Item = { id: string; name: string; unit: string | null; value: string };

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  msgs: Record<string, string>;
  items: Item[];
  labels: { hint: string; save: string };
};

const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';

export default function PriceEntryForm({ action, msgs, items, labels }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-stone-600">{labels.hint}</p>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{m(state.error)}</p>
      )}
      {items.map((it) => {
        const err = m(state?.fields?.[it.id]);
        return (
          <div key={it.id} className="space-y-1">
            <label htmlFor={`p-${it.id}`} className="block text-sm font-medium">
              {it.name}
              {it.unit ? `, ${it.unit}` : ''}
            </label>
            <input
              id={`p-${it.id}`}
              name={`p_${it.id}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={state?.values?.[it.id] ?? it.value}
              aria-invalid={err ? true : undefined}
              className={control}
            />
            {err && <p role="alert" className="text-sm text-anor-700">{err}</p>}
          </div>
        );
      })}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-lg bg-firuza-700 px-4 font-semibold text-white disabled:opacity-60"
      >
        {labels.save}
      </button>
    </form>
  );
}