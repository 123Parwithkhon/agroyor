import { formatAmount } from '@/lib/format';

type Props = {
  delta: number | null;
  labels: { up: string; down: string; same: string };
  lang: 'tj' | 'ru' | 'en';
};

/** Изменение к прошлой цене: ▲ гранат (подорожало), ▼ бирюза (подешевело), = без изменений. */
export default function Delta({ delta, labels, lang }: Props) {
  if (delta === null) return null;
  const d = Math.round(delta * 100) / 100;

  if (d === 0) {
    return (
      <span className="block text-xs text-stone-600">
        =<span className="sr-only"> {labels.same}</span>
      </span>
    );
  }

  const up = d > 0;
  return (
    <span className={`block text-xs font-medium ${up ? 'text-anor-700' : 'text-firuza-700'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {up ? '+' : '−'}
      {formatAmount(Math.abs(d), lang)}
      <span className="sr-only"> {up ? labels.up : labels.down}</span>
    </span>
  );
}
