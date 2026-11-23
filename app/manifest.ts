import type { MetadataRoute } from 'next';
import { DEFAULT_LANG, getDictionary, htmlLang } from '@/lib/i18n';

/** Позволяет добавить сайт на главный экран Android как приложение (текст — на языке по умолчанию). */
export default function manifest(): MetadataRoute.Manifest {
  const t = getDictionary(DEFAULT_LANG);
  return {
    name: t('app.name'),
    short_name: t('app.name'),
    description: t('app.tagline'),
    start_url: '/',
    display: 'standalone',
    background_color: '#fcf8f0',
    theme_color: '#1c3376',
    lang: htmlLang(DEFAULT_LANG),
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
