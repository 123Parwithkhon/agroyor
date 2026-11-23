'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartIcon, TractorIcon } from '@/components/icons';

type Props = { equipmentLabel: string; pricesLabel: string };

/** Две главные вкладки в шапке (с 640px); текущий раздел — светлая «плитка» с золотой каймой. */
export function NavLinks({ equipmentLabel, pricesLabel }: Props) {
  const pathname = usePathname();
  const items = [
    { href: '/equipment', label: equipmentLabel, Icon: TractorIcon },
    { href: '/prices', label: pricesLabel, Icon: ChartIcon },
  ];

  return (
    <>
      {items.map(({ href, label, Icon }) => {
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? 'page' : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 font-semibold ${
              current
                ? 'border-zar-400 bg-sand-50 text-lapis-900'
                : 'border-white/15 bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
