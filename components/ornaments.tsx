// Орнаменты в духе таджикского искусства: звезда-гирих, медальон сюзане, полоса атласа.
// Только SVG/CSS — ничего не скачивается дополнительно. Все декоративные: aria-hidden.

type Props = { className?: string };

/** Восьмиконечная звезда (гирих) — два наложенных квадрата. */
export function GirihStar({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? 'size-5'}>
      <g fill="currentColor">
        <rect x="5" y="5" width="14" height="14" rx="1" />
        <rect x="5" y="5" width="14" height="14" rx="1" transform="rotate(45 12 12)" />
      </g>
      <circle cx="12" cy="12" r="3.2" fill="#fff" fillOpacity=".85" />
    </svg>
  );
}

/** Медальон в духе сюзане: лепестки, круги и звезда в центре. */
export function SuzaniMedallion({ className }: Props) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="2" />
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="100"
          cy="42"
          rx="13"
          ry="30"
          fill="currentColor"
          fillOpacity=".55"
          transform={`rotate(${angle} 100 100)`}
        />
      ))}
      <circle cx="100" cy="100" r="40" fill="currentColor" fillOpacity=".9" />
      <g fill="#fff" fillOpacity=".9">
        <rect x="82" y="82" width="36" height="36" rx="2" />
        <rect x="82" y="82" width="36" height="36" rx="2" transform="rotate(45 100 100)" />
      </g>
      <circle cx="100" cy="100" r="9" fill="currentColor" />
    </svg>
  );
}

/** Полоса-орнамент атласа (рисуется CSS-классом из globals.css). */
export function OrnamentStrip({ thin = false }: { thin?: boolean }) {
  return <div aria-hidden="true" className={thin ? 'ornament-strip-thin' : 'ornament-strip'} />;
}

/** Заголовок раздела со звездой-гирих. */
export function OrnateHeading({ children, as = 'h2' }: { children: React.ReactNode; as?: 'h1' | 'h2' }) {
  const Tag = as;
  return (
    <Tag
      className={`flex items-center gap-2 font-bold text-lapis-900 ${as === 'h1' ? 'text-2xl' : 'text-xl'}`}
    >
      <GirihStar className={`shrink-0 text-anor-600 ${as === 'h1' ? 'size-6' : 'size-5'}`} />
      <span>{children}</span>
    </Tag>
  );
}
