'use client';

import { useActionState } from 'react';
import type { ResetState } from '@/lib/form-state';

type Props = {
  action: (prev: ResetState, formData: FormData) => Promise<ResetState>;
  labels: { button: string; confirm: string; result: string; hint: string; error: string };
};

export default function ResetPassword({ action, labels }: Props) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(action, null);

  return (
    <div className="mt-3">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(labels.confirm)) e.preventDefault();
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm font-medium disabled:opacity-60"
        >
          {labels.button}
        </button>
      </form>
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-anor-700">{labels.error}</p>
      )}
      {state?.password && (
        <div role="status" className="mt-2 rounded-lg bg-firuza-50 p-3">
          <p className="text-sm">{labels.result}</p>
          <p className="mt-1 select-all font-mono text-xl font-bold tracking-wider">{state.password}</p>
          <p className="mt-1 text-sm text-stone-600">{labels.hint}</p>
        </div>
      )}
    </div>
  );
}