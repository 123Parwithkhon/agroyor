// Иконки лендинга: контурные, в одном стиле с components/icons.tsx. Только SVG, цвет — currentColor.

const SHAPES = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2M8 17h2" />
    </>
  ),
  phone: (
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 5-6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  phoneDevice: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  // Иконки вместо эмодзи (одинаково выглядят на всех телефонах)
  sparkles: (
    <>
      <path d="M10 3l1.8 4.7L16.5 9.5l-4.7 1.8L10 16l-1.8-4.7L3.5 9.5l4.7-1.8z" />
      <path d="M18 14l.9 2.1 2.1.9-2.1.9L18 20l-.9-2.1-2.1-.9 2.1-.9z" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l9 5V4L6 9H4a1 1 0 0 0-1 1z" />
      <path d="M7 15l1.5 5h2.5L10 16" />
      <path d="M19 9a4 4 0 0 1 0 6" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6h11v10H2zM13 9h4l4 4v3h-8" />
      <circle cx="6.5" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </>
  ),
  bars: (
    <>
      <path d="M3 21h18" />
      <path d="M6 17v-5M11 17V7M16 17v-8M20 17V4" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" />
      <path d="M5 19c3-4 6-7 10-9" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="6" ry="3" />
      <path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
      <path d="M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.6-2.4-2.9-5.5-3" />
    </>
  ),
  road: (
    <>
      <path d="M8 3 4 21M16 3l4 18" />
      <path d="M12 4v3M12 11v3M12 18v3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  flame: <path d="M12 21c-4 0-7-2.8-7-6.5C5 10 9 8 9 3c3 2 4.5 4 4.5 7 1-1 1.5-2 1.5-3.5C17.5 8.5 19 11.5 19 14.5 19 18.2 16 21 12 21z" />,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" />,
  handshake: (
    <>
      <path d="M2 11l4-4 4 2 3-2 4 1 5 3" />
      <path d="M2 11l3 3M22 11l-3 4-5 4-3-2-3 1-3-3" />
      <path d="M10 9l-2 3 2 1 3-2 3 3" />
    </>
  ),
  check: <path d="m5 12 5 5L20 7" />,
  sprout: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7zM12 10c0-3.5 2.5-6 8-6 0 4-3 6-8 6" />
    </>
  ),
  basket: (
    <>
      <path d="M3 10h18l-2 10H5z" />
      <path d="M7 10l4-6M17 10l-4-6M9 14v3M15 14v3" />
    </>
  ),
  onion: (
    <>
      <path d="M12 7c-5 2-7 5-7 8a7 7 0 0 0 14 0c0-3-2-6-7-8z" />
      <path d="M12 7V3M10 4l2 3 2-3M12 13v8M9 20.5c-1.5-2-2-4-1.5-6M15 20.5c1.5-2 2-4 1.5-6" />
    </>
  ),
  potato: (
    <>
      <path d="M6 7c3-4 9-4 12 0s2 10-3 12-11 1-12-4 0-5 3-8z" />
      <path d="M9 10h.01M14 9h.01M15 14h.01M10 15h.01" />
    </>
  ),
  cotton: (
    <>
      <path d="M7 15a3.5 3.5 0 0 1 0-7 4 4 0 0 1 7.5-1A3.5 3.5 0 0 1 17 15z" />
      <path d="M12 15v6M9 21h6" />
    </>
  ),
  apple: (
    <>
      <path d="M12 7c-2-1.5-7-1.5-7 4 0 5 3 10 5 10 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-5 5-10 0-5.5-5-5.5-7-4z" />
      <path d="M12 7c0-2 1-4 3-4" />
    </>
  ),
  tractor: (
    <>
      <circle cx="7" cy="17" r="3" />
      <circle cx="18" cy="18" r="2" />
      <path d="M4 14V7h6l2 5h6a2 2 0 0 1 2 2v2M10 17h6M14 12V8" />
    </>
  ),
} as const;

export type IconName = keyof typeof SHAPES;

export default function Icon({ name, className = 'size-6' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {SHAPES[name]}
    </svg>
  );
}
