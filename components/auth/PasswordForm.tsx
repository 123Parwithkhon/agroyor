'use client';

import { useActionState } from 'react';
import { changePasswordAction } from '@/app/me/password/actions';
import type { FormState } from '@/lib/form-state';
import Field from './Field';

type Props = {
  msgs: Record<string, string>;
  labels: { current: string; next: string; save: string };
};

export default function PasswordForm({ msgs, labels }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, null);
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{m(state.error)}</p>
      )}
      <Field
        label={labels.current}
        name="current"
        type="password"
        autoComplete="current-password"
        error={m(state?.fields?.current)}
      />
      <Field
        label={labels.next}
        name="next"
        type="password"
        autoComplete="new-password"
        error={m(state?.fields?.next)}
      />
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