'use client';

import { useActionState } from 'react';
import type { FormState } from '@/lib/form-state';
import PhotoUploader from './PhotoUploader';

type Option = { value: string; label: string };

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  msgs: Record<string, string>;
  types: Option[];
  units: Option[];
  districts: Option[];
  initial?: {
    type: string;
    title: string;
    description: string;
    district: string;
    price: number;
    priceUnit: string;
    withOperator: boolean;
    photos: string[];
  };
  labels: {
    type: string;
    title: string;
    description: string;
    district: string;
    price: string;
    priceUnit: string;
    withOperator: string;
    photos: string;
    photosAdd: string;
    photoRemove: string;
    photoUploading: string;
    save: string;
  };
};

const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';

function Select({
  id, label, options, value, error,
}: { id: string; label: string; options: Option[]; value: string; error?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={`f-${id}`} className="block text-sm font-medium">{label}</label>
      <select id={`f-${id}`} name={id} required defaultValue={value} className={control}>
        <option value="" disabled />
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p role="alert" className="text-sm text-anor-700">{error}</p>}
    </div>
  );
}

export default function EquipmentForm({ action, msgs, types, units, districts, initial, labels }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const m = (key?: string) => (key ? (msgs[key] ?? msgs['err.generic']) : undefined);
  const f = state?.fields;
  const v = (key: string, fallback?: string | number) =>
    state?.values?.[key] ?? (fallback === undefined ? '' : String(fallback));

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{m(state.error)}</p>
      )}
      <Select id="type" label={labels.type} options={types} value={v('type', initial?.type)} error={m(f?.type)} />
      <div className="space-y-1">
        <label htmlFor="f-title" className="block text-sm font-medium">{labels.title}</label>
        <input id="f-title" name="title" required defaultValue={v('title', initial?.title)} className={control} />
        {f?.title && <p role="alert" className="text-sm text-anor-700">{m(f.title)}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor="f-description" className="block text-sm font-medium">{labels.description}</label>
        <textarea
          id="f-description"
          name="description"
          rows={5}
          defaultValue={v('description', initial?.description)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base"
        />
        {f?.description && <p role="alert" className="text-sm text-anor-700">{m(f.description)}</p>}
      </div>
      <Select id="district" label={labels.district} options={districts} value={v('district', initial?.district)} error={m(f?.district)} />
      <div className="space-y-1">
        <label htmlFor="f-price" className="block text-sm font-medium">{labels.price}</label>
        <input
          id="f-price"
          name="price"
          type="number"
          inputMode="decimal"
          min="1"
          step="any"
          required
          defaultValue={v('price', initial?.price)}
          className={control}
        />
        {f?.price && <p role="alert" className="text-sm text-anor-700">{m(f.price)}</p>}
      </div>
      <Select id="priceUnit" label={labels.priceUnit} options={units} value={v('priceUnit', initial?.priceUnit)} error={m(f?.priceUnit)} />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="withOperator" defaultChecked={state?.values ? state.values.withOperator === 'on' : initial?.withOperator} className="size-5" />
        <span className="text-base">{labels.withOperator}</span>
      </label>
      <div className="space-y-2">
        <p className="text-sm font-medium">{labels.photos}</p>
        <PhotoUploader
          initial={initial?.photos ?? []}
          labels={{
            add: labels.photosAdd,
            remove: labels.photoRemove,
            uploading: labels.photoUploading,
            error: msgs['err.photoInvalid'] ?? '',
          }}
        />
        {f?.photos && <p role="alert" className="text-sm text-anor-700">{m(f.photos)}</p>}
      </div>
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