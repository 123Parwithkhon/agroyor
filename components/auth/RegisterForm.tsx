'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/register/actions';
import type { FormState } from '@/lib/form-state';
import Field from './Field';

type Props = {
  msgs: Record<string, string>;
  districts: { code: string; name: string }[];
  labels: {
    phone: string;
    phoneHint: string;
    password: string;
    name: string;
    district: string;
    districtChoose: string;
    submit: string;
  };
};

export default function RegisterForm({ msgs, districts, labels }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, null);
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);
  const districtError = m(state?.fields?.district);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">
          {m(state.error)}
        </p>
      )}
      <Field label={labels.name} name="name" autoComplete="name" defaultValue={state?.values?.name} error={m(state?.fields?.name)} />
      <Field
        label={labels.phone}
        name="phone"
        defaultValue={state?.values?.phone}
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
        autoComplete="new-password"
        error={m(state?.fields?.password)}
      />
      <div className="space-y-1">
        <label htmlFor="f-district" className="block text-sm font-medium">
          {labels.district}
        </label>
        <select
          id="f-district"
          name="district"
          required
          defaultValue={state?.values?.district ?? ''}
          className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base"
        >
          <option value="" disabled>
            {labels.districtChoose}
          </option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
        {districtError && (
          <p role="alert" className="text-sm text-anor-700">
            {districtError}
          </p>
        )}
      </div>
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