import Link from 'next/link';
import { UserIcon } from '@/components/icons';
import { LangSwitch } from '@/components/LangSwitch';
import { NavLinks } from '@/components/NavLinks';
import { GirihStar, OrnamentStrip } from '@/components/ornaments';
import type { Lang, T } from '@/lib/i18n';

type Props = {
  lang: Lang;
  t: T;
  /** Имя вошедшего пользователя или null */
  userName: string | null;
  /** Новые заявки и изменения статусов броней */
  badge: number;
};

/** Шапка цвета лазурита с полосой-орнаментом атласа снизу. */
export function Header({ lang, t, userName, badge }: Props) {
  return (
    <header className="on-dark bg-lapis-800 text-white">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
        <Link href="/" className="mr-auto flex min-h-11 items-center gap-2 text-xl font-bold tracking-wide">
          <GirihStar className="size-7 text-zar-400" />
          {t('app.name')}
        </Link>
        <LangSwitch lang={lang} t={t} />
        {/* На телефоне кабинет и вход — во вкладке «Кабинет» нижней панели */}
        <Link
          href={userName ? '/me' : '/login'}
          className="hidden min-h-11 max-w-48 items-center justify-center gap-1 rounded-lg px-2 font-medium text-white hover:bg-white/10 sm:flex"
        >
          <UserIcon />
          <span className="truncate">{userName ?? t('nav.login')}</span>
          {badge > 0 && <Badge count={badge} />}
        </Link>
      </div>
      {/* Верхнее меню — с 640px; на телефоне его заменяет BottomNav */}
      <nav aria-label={t('nav.main')} className="mx-auto hidden max-w-5xl grid-cols-2 gap-2 px-4 pb-3 sm:grid">
        <NavLinks equipmentLabel={t('nav.equipment')} pricesLabel={t('nav.prices')} />
      </nav>
      <OrnamentStrip />
    </header>
  );
}

/** Красный кружок с числом (до 99+) */
export function Badge({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-anor-600 px-1 text-xs leading-5 font-bold text-white tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  );
}
