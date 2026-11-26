import type { Metadata, Viewport } from 'next';
import { preload } from 'react-dom';
import { BottomNav } from '@/components/BottomNav';
import { OfflineSupport } from '@/components/OfflineSupport';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getCurrentUser } from '@/lib/auth-guards';
import { htmlLang } from '@/lib/i18n';
import { getT } from '@/lib/i18n-server';
import { getBadgeCount } from '@/lib/queries/bookings';
import { getDemandBadge } from '@/lib/queries/demand';
import './globals.css';

function preloadFonts(): void {
  // Все три файла нужны на любой странице: латиница (цифры, знаки), кириллица, таджикские буквы (3,5 КБ)
  for (const file of ['noto-sans-cyrillic', 'noto-sans-latin', 'noto-sans-tajik']) {
    preload(`/fonts/${file}.woff2`, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: t('app.name'), template: `%s — ${t('app.name')}` },
    description: t('app.tagline'),
    applicationName: t('app.name'),
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Разрешаем увеличение пальцами (доступность) и учитываем вырезы экрана (safe-area)
  viewportFit: 'cover',
  // Лазурит — цвет шапки, им же красится строка состояния Android
  themeColor: '#1c3376',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getT();
  preloadFonts();
  // Без БД (например, при недоступном Neon) шапка всё равно рисуется — как для гостя
  const user = await getCurrentUser().catch(() => null);
  // Бейдж: заявки и брони + новые «кличи» рядом с моей техникой и отклики на мои запросы
  const badge = user ? (await getBadgeCount(user.id)) + (await getDemandBadge(user.id)) : 0;
  return (
    <html lang={htmlLang(lang)}>
      {/* Отступ снизу на телефоне = высота нижней панели (64px + полоса орнамента 6px) */}
      <body className="flex bg-sand-50 min-h-screen flex-col pb-[calc(70px+env(safe-area-inset-bottom))] font-sans text-stone-900 antialiased sm:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 focus:text-lapis-900"
        >
          {t('common.skipToContent')}
        </a>
        <OfflineSupport text={t('pwa.offline')} />
        <Header lang={lang} t={t} userName={user?.name ?? null} badge={badge} />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
        <Footer t={t} />
        <BottomNav
          ariaLabel={t('nav.main')}
          meHref={user ? '/me' : '/login'}
          badge={badge}
          labels={{ home: t('nav.home'), equipment: t('nav.equipment'), prices: t('nav.prices'), me: t('nav.me') }}
        />
      </body>
    </html>
  );
}
