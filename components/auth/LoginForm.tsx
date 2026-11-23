'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/login/actions';
import type { FormState } from '@/lib/form-state';
import Field from './Field';

type Props = {
  next: string;
  msgs: Record<string, string>;
  labels: { phone: string; phoneHint: string; password: string; submit: string };
};

export default function LoginForm({ next, msgs, labels }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, null);
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state?.error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">
          {m(state.error)}
        </p>
      )}
      <Field
        label={labels.phone}
        defaultValue={state?.values?.phone}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint={labels.phoneHint}
        error={m(state?.fields?.phone)}
      />
      <Field
        label={labels.password}
        name="password"
        type="password"
        autoComplete="current-password"
        error={m(state?.fields?.password)}
      />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-lg bg-firuza-700 px-4 font-semibold text-white disabled:opacity-60"
      >
        {labels.submit}
      </button>
    </form>
  );
}