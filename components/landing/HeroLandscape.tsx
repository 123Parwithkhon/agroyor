// Пейзаж для лендинга: рассвет над горами и поля Ферганской долины, борозды сходятся к горизонту.
// Чистый SVG (~2 КБ в HTML), ничего не скачивается. Декоративный: aria-hidden.

const W = 1440;
const H = 330;
const HORIZON = 190;
const VANISH_X = 760;

// Полосы полей: верх у горизонта, низ — веером по нижнему краю
const STRIPES = Array.from({ length: 26 }, (_, n) => {
  const i = n - 13;
  const top = (k: number) => VANISH_X + k * 58;
  const bottom = (k: number) => VANISH_X + k * 330;
  // Каждая пятая полоса — золотая (пшеница), остальные чередуют два оттенка бирюзы
  const fill = n % 5 === 2 ? '#a7741c' : n % 2 === 0 ? '#0a5c53' : '#0b7266';
  return {
    points: `${top(i)},${HORIZON} ${top(i + 1)},${HORIZON} ${bottom(i + 1)},${H} ${bottom(i)},${H}`,
    fill,
  };
});

export function HeroLandscape({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f0cd7e" stopOpacity="0.75" />
          <stop offset="0.35" stopColor="#e9b44c" stopOpacity="0.25" />
          <stop offset="1" stopColor="#e9b44c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#152657" stopOpacity="0.5" />
          <stop offset="1" stopColor="#152657" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Солнце встаёт за горами */}
      <circle cx="900" cy="170" r="320" fill={`url(#${id}-sun)`} />
      <circle cx="900" cy="168" r="30" fill="#f6dc9f" />

      {/* Дальний хребет */}
      <path
        d="M0 190V122l90-26 80 22 92-48 78 34 90-26 92 32 88-52 92 40 90-16 90 36 100-46 80 24 90-44 92 38 88-14 112 32V190Z"
        fill="#23408e"
        fillOpacity="0.7"
      />
      {/* Ближний хребет */}
      <path
        d="M0 190v-40l120-22 90 22 110-32 110 34 110-17 110 25 110-28 100 23 120-30 110 25 110-20 110 25 130-17V190Z"
        fill="#1c3376"
      />

      {/* Поля */}
      {STRIPES.map((s) => (
        <polygon key={s.points} points={s.points} fill={s.fill} />
      ))}
      {/* Дымка у горизонта даёт глубину */}
      <rect x="0" y={HORIZON} width={W} height="70" fill={`url(#${id}-haze)`} />
      <rect x="0" y={HORIZON - 1} width={W} height="1.5" fill="#f0cd7e" fillOpacity="0.5" />
    </svg>
  );
}
