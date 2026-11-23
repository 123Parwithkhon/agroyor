type Props = {
  label: string;
  name: string;
  type?: 'text' | 'password' | 'tel';
  autoComplete?: string;
  inputMode?: 'tel' | 'text';
  hint?: string;
  error?: string;
  defaultValue?: string;
};

export default function Field({
  label, name, type = 'text', autoComplete, inputMode, hint, error, defaultValue,
}: Props) {
  const id = `f-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base"
      />
      {hint && !error && <p className="text-sm text-stone-600">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-sm text-anor-700">
          {error}
        </p>
      )}
    </div>
  );
}