type Initial = {
  id: string;
  name_tj: string;
  name_ru: string;
  name_en: string | null;
  unit?: string;
  sort_order: number;
  active: boolean;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  prefix: string;
  /** Единицы продукта (kg, piece, litre) с подписями; не передаются — у записи нет единицы (рынок) */
  units?: { value: string; label: string }[];
  initial?: Initial;
  labels: {
    nameTj: string; nameRu: string; nameEn: string; unit: string;
    sortOrder: string; active: string; submit: string;
  };
};

const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base';

export default function CatalogForm({ action, prefix, units, initial, labels }: Props) {
  const uid = `${prefix}-${initial?.id ?? 'new'}`;
  const field = (name: string, label: string, value: string | number | undefined, opts: { type?: string; required?: boolean } = {}) => (
    <div className="space-y-1">
      <label htmlFor={`${uid}-${name}`} className="block text-sm font-medium">{label}</label>
      <input
        id={`${uid}-${name}`}
        name={name}
        type={opts.type ?? 'text'}
        defaultValue={value}
        required={opts.required ?? false}
        min={opts.type === 'number' ? 0 : undefined}
        max={opts.type === 'number' ? 9999 : undefined}
        maxLength={opts.type === 'number' ? undefined : 80}
        className={control}
      />
    </div>
  );

  return (
    <form action={action} className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        {field('nameTj', labels.nameTj, initial?.name_tj, { required: true })}
        {field('nameRu', labels.nameRu, initial?.name_ru, { required: true })}
        {field('nameEn', labels.nameEn, initial?.name_en ?? '')}
        {units && (
          <div className="space-y-1">
            <label htmlFor={`${uid}-unit`} className="block text-sm font-medium">{labels.unit}</label>
            <select id={`${uid}-unit`} name="unit" defaultValue={initial?.unit ?? units[0]?.value} className={control}>
              {units.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        )}
        {field('sortOrder', labels.sortOrder, initial?.sort_order ?? 0, { type: 'number' })}
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="isActive" defaultChecked={initial ? initial.active : true} className="size-5" />
        <span>{labels.active}</span>
      </label>
      <button type="submit" className="min-h-11 rounded-lg bg-firuza-700 px-4 font-semibold text-white">
        {labels.submit}
      </button>
    </form>
  );
}
