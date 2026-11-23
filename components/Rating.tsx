/** Рейтинг: звезда, среднее и число отзывов. Без отзывов — ничего не показываем. */
export function Rating({ value, count, label }: { value: number | null; count: number; label: string }) {
  if (value === null || count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-zar-700" aria-label={`${label}: ${value} / 5`}>
      <svg viewBox="0 0 20 20" className="size-4 fill-zar-500" aria-hidden="true">
        <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />
      </svg>
      {value.toFixed(1)}
      <span className="font-normal text-stone-500">({count})</span>
    </span>
  );
}
