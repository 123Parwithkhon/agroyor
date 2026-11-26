// Пейзаж для лендинга на всю высоту героя: рассвет, снежные вершины Туркестанского хребта,
// ряды тополей на горизонте и поля Ферганской долины с полевой дорогой и трактором.
// Чистый SVG, ничего не скачивается. Декоративный: aria-hidden.

const W = 1440;
const H = 900;
const HORIZON = 700;
const VANISH_X = 760;

type Pt = [number, number];

// Детерминированный «случайный» генератор — одинаковая картинка на сервере и в браузере
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const r = rand(7);
const STARS = Array.from({ length: 46 }, (_, i) => ({
  cx: Math.round(r() * W),
  cy: Math.round(20 + r() * 300),
  r: r() > 0.85 ? 1.6 : 0.9,
  o: (0.3 + r() * 0.6).toFixed(2),
  twinkle: i % 6 === 0,
}));

// Дальний хребет со снежными пиками
const FAR: Pt[] = [
  [0, 470], [80, 430], [150, 455], [240, 380], [300, 410], [360, 360], [430, 420], [520, 395],
  [600, 300], [660, 350], [720, 330], [800, 390], [880, 340], [960, 250], [1030, 320], [1090, 290],
  [1170, 360], [1250, 310], [1330, 370], [1440, 340],
];
const poly = (pts: Pt[], base: number) => `M0 ${base} ${pts.map(([x, y]) => `L${x} ${y}`).join(' ')} L${W} ${base}Z`;

const at = (k: number): Pt => FAR[k] ?? [0, HORIZON];

// Снежная шапка: спускается по склонам на долю f, нижний край рваный
function snowCap(i: number, f: number): string {
  const [px, py] = at(i);
  const [lx, ly] = at(i - 1);
  const [rx, ry] = at(i + 1);
  const L: Pt = [px + (lx - px) * f, py + (ly - py) * f];
  const R: Pt = [px + (rx - px) * f, py + (ry - py) * f];
  const mid = (a: number, b: number, t: number) => a + (b - a) * t;
  const jag: Pt[] = [
    [mid(R[0], L[0], 0.2), mid(R[1], L[1], 0.2) + 9],
    [mid(R[0], L[0], 0.4), mid(R[1], L[1], 0.4) - 4],
    [mid(R[0], L[0], 0.6), mid(R[1], L[1], 0.6) + 11],
    [mid(R[0], L[0], 0.8), mid(R[1], L[1], 0.8) - 2],
  ];
  const pts: Pt[] = [[px, py], R, ...jag, L];
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}
// Снег только на правых вершинах: слева горы под заголовком, белые пятна мешали бы тексту
const CAPS = [snowCap(13, 0.45), snowCap(15, 0.4), snowCap(18, 0.35)];

// Тополя вдоль горизонта — группами, как лесополосы между полями
const rp = rand(23);
const POPLAR_GROUPS: Pt[] = [[40, 9], [330, 7], [600, 6], [930, 8], [1220, 10]];
const POPLARS = POPLAR_GROUPS.flatMap(([start, count]) =>
  Array.from({ length: count }, (_, k) => {
    const h = 22 + rp() * 20;
    return { cx: start + k * 13 + rp() * 4, h };
  }),
);

// Полосы полей: верх у горизонта, низ — веером по нижнему краю
const STRIPES = Array.from({ length: 30 }, (_, n) => {
  const i = n - 15;
  const top = (k: number) => VANISH_X + k * 44;
  const bottom = (k: number) => VANISH_X + k * 300;
  const fill = n % 5 === 2 ? '#b07d22' : n % 7 === 4 ? '#6f7f2a' : n % 2 === 0 ? '#0a5c53' : '#0b7266';
  return `${top(i)},${HORIZON} ${top(i + 1)},${HORIZON} ${bottom(i + 1)},${H} ${bottom(i)},${H}`.concat('|', fill);
});

// compact — только горизонт и поля (узкая полоса внизу блока)
export function HeroLandscape({ id, className, compact = false }: { id: string; className?: string; compact?: boolean }) {
  const top = compact ? 560 : 0;
  return (
    <svg viewBox={`0 ${top} ${W} ${H - top}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6dc9f" stopOpacity="0.8" />
          <stop offset="0.3" stopColor="#e9b44c" stopOpacity="0.3" />
          <stop offset="1" stopColor="#e9b44c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a67b4" />
          <stop offset="1" stopColor="#23408e" />
        </linearGradient>
        <linearGradient id={`${id}-snow`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9d6f2" />
          <stop offset="1" stopColor="#fbe7bd" />
        </linearGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#152657" stopOpacity="0.45" />
          <stop offset="1" stopColor="#152657" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-glow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9b44c" stopOpacity="0" />
          <stop offset="1" stopColor="#e9b44c" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b46a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#c99a4a" />
        </linearGradient>
      </defs>

      {/* Звёзды гаснут к рассвету */}
      {STARS.map((s) => (
        <circle
          key={`${s.cx}-${s.cy}`}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="#fdf6e7"
          opacity={s.o}
          className={s.twinkle ? 'hero-twinkle' : undefined}
        />
      ))}

      {/* Солнце встаёт из седловины между вершинами */}
      <circle cx="1170" cy="360" r="420" fill={`url(#${id}-sun)`} />
      <circle cx="1170" cy="345" r="30" fill="#f6dc9f" />

      {/* Дальний хребет и снег */}
      <path d={poly(FAR, HORIZON)} fill={`url(#${id}-far)`} fillOpacity="0.9" />
      {CAPS.map((p) => (
        <polygon key={p} points={p} fill={`url(#${id}-snow)`} fillOpacity="0.9" />
      ))}

      {/* Средний хребет */}
      <path
        d="M0 700V560L110 520 200 545 300 490 390 530 480 505 560 545 680 480 780 530 860 515 940 550 1050 470 1140 520 1220 500 1320 540 1440 500V700Z"
        fill="#1f3a83"
      />
      {/* Предгорья */}
      <path
        d="M0 700V640C120 612 220 630 320 646S520 612 640 630 860 660 980 636 1220 602 1320 626 1420 642 1440 636V700Z"
        fill="#172d68"
      />

      {/* Тополя */}
      {POPLARS.map((p) => (
        <ellipse key={p.cx} cx={p.cx} cy={HORIZON - p.h / 2 + 2} rx="4.5" ry={p.h / 2} fill="#0b3540" />
      ))}

      {/* Поля */}
      {STRIPES.map((s) => {
        const [points, fill] = s.split('|');
        return <polygon key={points} points={points} fill={fill} />;
      })}
      {/* Полевая дорога к горизонту */}
      <polygon points={`${VANISH_X - 3},${HORIZON} ${VANISH_X + 3},${HORIZON} ${VANISH_X + 95},${H} ${VANISH_X - 95},${H}`} fill={`url(#${id}-road)`} />

      {/* Трактор с фарами едет по дороге */}
      <g transform={`translate(${VANISH_X + 6} 752)`}>
        <polygon points="-2,-4 -70,10 -70,-18" fill="#f6dc9f" fillOpacity="0.18" />
        <rect x="-4" y="-22" width="20" height="18" rx="2" fill="#0d1a40" />
        <rect x="-1" y="-19" width="12" height="8" rx="1" fill="#e9b44c" fillOpacity="0.55" />
        <rect x="-18" y="-10" width="22" height="9" rx="2" fill="#0d1a40" />
        <circle cx="11" cy="0" r="9" fill="#0d1a40" />
        <circle cx="-13" cy="3" r="5" fill="#0d1a40" />
        <circle cx="-18" cy="-6" r="2" fill="#f6dc9f" />
      </g>

      {/* Дымка у горизонта даёт глубину */}
      <rect x="0" y={HORIZON - 60} width={W} height="60" fill={`url(#${id}-glow)`} />
      <rect x="0" y={HORIZON} width={W} height="80" fill={`url(#${id}-haze)`} />
      <rect x="0" y={HORIZON - 1} width={W} height="1.5" fill="#f0cd7e" fillOpacity="0.45" />
    </svg>
  );
}
