/**
 * Мини-график за неделю (SVG, без библиотек): гранатовый — цена выросла за период,
 * бирюзовый — снизилась, серый — без изменений. Меньше 2 точек — ничего не рисуем.
 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const w = 40;
  const h = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
    .join(' ');
  const first = values[0] ?? 0;
  const last = values.at(-1) ?? 0;
  const color = last > first ? '#b0183f' : last < first ? '#0b7266' : '#a8a29e';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={label} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
