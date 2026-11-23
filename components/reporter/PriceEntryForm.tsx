'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '@/lib/form-state';
import { parsePrice } from '@/lib/prices-rules';

type Item = {
  id: string;
  name: string;
  unit: string | null;
  value: string;
  /** Последняя известная цена этого рынка (до выбранного дня) — подсказка и «как раньше» */
  last: number | null;
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  msgs: Record<string, string>;
  items: Item[];
  labels: { hint: string; save: string; last: string; fillLast: string; quick: string; check: string };
};

const control = 'min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 text-lg tabular-nums';
const fmt = (n: number) => String(n).replace('.', ',');

/**
 * Быстрый ввод цен с телефона: под каждым полем — прошлая цена, одна кнопка «подставить прошлые»,
 * стрелка ▲▼ к прошлой цене сразу при вводе (видно опечатку до сохранения), кнопка «Сохранить»
 * закреплена внизу экрана.
 */
export default function PriceEntryForm({ action, msgs, items, labels }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((it) => [it.id, state?.values?.[it.id] ?? it.value])),
  );
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);
  const hasLast = items.some((it) => it.last !== null);

  const fillLast = () =>
    setVals((v) => {
      const next = { ...v };
      for (const it of items) if (!next[it.id] && it.last !== null) next[it.id] = fmt(it.last);
      return next;
    });

  return (
    <form action={formAction} className="space-y-4 pb-24 sm:pb-4">
      <p className="text-sm text-stone-600">{labels.quick} {labels.hint}</p>
      {hasLast && (
        <button type="button" onClick={fillLast}
          className="min-h-11 w-full rounded-lg border-2 border-firuza-700 bg-white px-4 font-semibold text-firuza-800">
          {labels.fillLast}
        </button>
      )}
      {state?.error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{m(state.error)}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const err = m(state?.fields?.[it.id]);
          const raw = vals[it.id] ?? '';
          const parsed = raw ? parsePrice(raw) : null;
          const now = parsed?.ok ? parsed.value : null;
          const trend = now !== null && it.last !== null ? Math.sign(now - it.last) : null;
          // Подозрительно большое отличие — вероятная опечатка (35 вместо 3,5)
          const suspicious = now !== null && it.last !== null && Math.abs(now - it.last) / it.last > 0.5;
          return (
            <div key={it.id} className="space-y-1">
              <label htmlFor={`p-${it.id}`} className="block text-sm font-semibold text-lapis-900">
                {it.name}
                {it.unit ? <span className="font-normal text-stone-500">, {it.unit}</span> : null}
              </label>
              <div className="relative">
                <input
                  id={`p-${it.id}`}
                  name={`p_${it.id}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  enterKeyHint="next"
                  value={raw}
                  placeholder={it.last !== null ? fmt(it.last) : ''}
                  onChange={(e) => setVals((v) => ({ ...v, [it.id]: e.target.value }))}
                  aria-invalid={err || suspicious ? true : undefined}
                  className={`${control} pr-8 ${suspicious ? 'border-zar-500 ring-1 ring-zar-500' : ''}`}
                />
                {trend !== null && trend !== 0 && (
                  <span aria-hidden="true" className={`absolute top-1/2 right-2 -translate-y-1/2 ${trend > 0 ? 'text-anor-600' : 'text-firuza-700'}`}>
                    {trend > 0 ? '▲' : '▼'}
                  </span>
                )}
              </div>
              {it.last !== null && <p className="text-xs text-stone-500">{labels.last}: {fmt(it.last)}</p>}
              {suspicious && <p className="text-xs font-medium text-zar-700">{labels.check}</p>}
              {err && <p role="alert" className="text-sm text-anor-700">{err}</p>}
            </div>
          );
        })}
      </div>
      {/* На телефоне кнопка закреплена над нижней панелью — не нужно листать список */}
      <div className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] z-30 border-t border-sand-200 bg-white/95 p-3 sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-lg bg-firuza-700 px-4 text-lg font-semibold text-white disabled:opacity-60"
        >
          {labels.save}
        </button>
      </div>
    </form>
  );
}
