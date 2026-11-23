'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartIcon, HomeIcon, TractorIcon, UserIcon } from '@/components/icons';

type Props = {
  labels: { home: string; equipment: string; prices: string; me: string };
  ariaLabel: string;
  /** Вкладка «Кабинет»: /me для вошедшего, иначе /login */
  meHref: string;
  /** Число новых заявок и изменений статусов (бейдж на вкладке «Кабинет») */
  badge: number;
};

/**
 * Нижняя панель вкладок — только на телефоне (до 640px).
 * Большие зоны нажатия под большой палец, иконка + подпись; сверху — тонкая полоса орнамента.
 */
export function BottomNav({ labels, ariaLabel, meHref, badge }: Props) {
  const pathname = usePathname();
  const startsWith = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  const items = [
    { href: '/', label: labels.home, Icon: HomeIcon, current: pathname === '/', count: 0 },
    { href: '/equipment', label: labels.equipment, Icon: TractorIcon, current: startsWith('/equipment'), count: 0 },
    { href: '/prices', label: labels.prices, Icon: ChartIcon, current: startsWith('/prices'), count: 0 },
    {
      href: meHref,
      label: labels.me,
      Icon: UserIcon,
      current: ['/me', '/login', '/register', '/admin', '/reporter'].some(startsWith),
      count: badge,
    },
  ];

  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-40 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgb(21_38_87/0.08)] sm:hidden"
    >
      <div aria-hidden="true" className="ornament-strip-thin" />
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, Icon, current, count }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={current ? 'page' : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[13px] leading-tight font-medium ${
                current ? 'text-lapis-900' : 'text-stone-600'
              }`}
            >
              <span
                className={`relative flex h-8 w-14 items-center justify-center rounded-full ${
                  current ? 'bg-zar-300 text-lapis-900' : ''
                }`}
              >
                <Icon className="size-6" />
                {count > 0 && (
                  <span className="absolute -top-1 right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-anor-600 px-1 text-xs leading-5 font-bold text-white tabular-nums">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
