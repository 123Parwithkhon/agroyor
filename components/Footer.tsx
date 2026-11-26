import Link from 'next/link';
import { DownloadIcon } from '@/components/icons';
import { GirihStar, OrnamentStrip } from '@/components/ornaments';
import type { T } from '@/lib/i18n';

/** Подвал цвета тёмного лазурита с полосой атласа сверху. */
export function Footer({ t }: { t: T }) {
  return (
    <footer className="on-dark mt-10 bg-lapis-900 text-lapis-100">
      <OrnamentStrip />
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm lg:flex-row lg:items-center lg:justify-between">
        <p className="flex items-center gap-2">
          <GirihStar className="size-5 shrink-0 text-zar-400" />
          {t('footer.about')}
        </p>
        {/* Умные инструменты: подбор, клич, рейс на рынок, аналитика региона */}
        <nav aria-label={t('tools.title')} className="flex flex-wrap gap-x-4 lg:flex-1 lg:justify-center">
          <Link href="/equipment/match" className="flex min-h-11 items-center hover:text-white hover:underline">{t('tools.match')}</Link>
          <Link href="/requests" className="flex min-h-11 items-center hover:text-white hover:underline">{t('tools.demand')}</Link>
          <Link href="/trips" className="flex min-h-11 items-center hover:text-white hover:underline">{t('tools.trips')}</Link>
          <Link href="/analytics" className="flex min-h-11 items-center hover:text-white hover:underline">{t('tools.analytics')}</Link>
        </nav>
        {/* Обычная ссылка, а не <Link>: это файл, а не страница */}
        <a href="/api/prices.xlsx" className="flex min-h-11 items-center gap-1 font-medium text-zar-300 underline">
          <DownloadIcon className="size-5" />
          {t('footer.xlsx')}
        </a>
      </div>
    </footer>
  );
}
