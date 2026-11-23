'use client';

import { useActionState, useId, useState } from 'react';
import { parseArea, shareCost } from '@/lib/group-rules';
import type { FormState } from '@/lib/form-state';
import { formatMoney } from '@/lib/format';
import type { Lang } from '@/lib/i18n';

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  msgs: Record<string, string>;
  lang: Lang;
  pricePerHa: number;
  labels: { area: string; join: string; share: string; joinedNotice: string };
};

/** Присоединиться к складчине: ввести свою площадь и сразу увидеть свою долю. */
export default function JoinGroupForm({ action, msgs, lang, pricePerHa, labels }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [area, setArea] = useState(state?.values?.area ?? '');
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);
  const parsed = parseArea(area);
  const inputId = useId();

  if (state?.notice) {
    return <p role="status" className="rounded-lg bg-firuza-50 p-3 font-semibold text-firuza-800">{labels.joinedNotice}</p>;
  }
  return (
    <form action={formAction} className="mt-3 space-y-2">
      {state?.error && <p role="alert" className="rounded-lg bg-anor-50 p-2 text-sm text-anor-700">{m(state.error)}</p>}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label htmlFor={inputId} className="block text-sm font-medium">{labels.area}</label>
          <input
            id={inputId}
            name="area"
            inputMode="decimal"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base"
          />
        </div>
        <button type="submit" disabled={pending || parsed === null}
          className="min-h-11 rounded-lg bg-firuza-700 px-4 font-semibold text-white disabled:opacity-60">
          {labels.join}
        </button>
      </div>
      {state?.fields?.area && <p role="alert" className="text-sm text-anor-700">{m(state.fields.area)}</p>}
      {parsed !== null && (
        <p className="text-sm text-stone-700" aria-live="polite">
          {labels.share}: <b className="text-firuza-800">{formatMoney(shareCost(parsed, pricePerHa), lang)}</b>
        </p>
      )}
    </form>
  );
}
