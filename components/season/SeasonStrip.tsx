import Link from 'next/link';
import { typeKey } from '@/lib/equipment';
import type { T } from '@/lib/i18n';
import { SEASON_INFO, seasonMonthsKey, seasonTitleKey, type Season } from '@/lib/season';
import Icon from '@/components/landing/Icon';

/** Полоса «Сейчас сезон: …» над каталогом: актуальная техника — ссылками-фильтрами. */
export function SeasonStrip({ season, t, activeType }: { season: Season; t: T; activeType?: string }) {
  const info = SEASON_INFO[season];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-zar-50 px-4 py-3 ring-1 ring-zar-300">
      <span className="text-sm font-bold text-lapis-900">
        <Icon name="calendar" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('season.now')}: {t(seasonTitleKey(season))}
        <span className="ms-1 font-normal text-stone-600">({t(seasonMonthsKey(season))})</span>
      </span>
      <span className="text-sm text-stone-600">{t('season.relevant')}:</span>
      <ul className="flex flex-wrap gap-1.5">
        {info.types.map((k) => (
          <li key={k}>
            <Link
              href={`/equipment?type=${k}`}
              aria-current={activeType === k ? 'true' : undefined}
              className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold transition ${
                activeType === k ? 'bg-lapis-900 text-zar-300' : 'bg-white text-lapis-800 ring-1 ring-zar-300 hover:bg-lapis-900 hover:text-white'
              }`}
            >
              {t(typeKey(k))}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
