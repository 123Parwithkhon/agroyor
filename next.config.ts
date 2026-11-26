import type { NextConfig } from 'next';

// Базовые заголовки безопасности для всех ответов
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // postgres.js не бандлим — подключается как обычный node-модуль
  serverExternalPackages: ['postgres'],
  poweredByHeader: false,
  experimental: {
    // Кэш Turbopack в .next/ без чистки разрастался до сотен МБ.
    // Сборщик мусора удаляет то, что не использовалось больше суток.
    turbopackGc: { rootTtlMs: 24 * 60 * 60 * 1000 },
    // Кэш для next build локально почти не переиспользуется — не пишем его.
    turbopackFileSystemCacheForBuild: false,
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Шрифты кешируются на год (экономия трафика на 3G). При замене файла — меняйте его имя!
      {
        source: '/fonts/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Service worker браузер должен перепроверять каждый раз — иначе обновления сайта придут с опозданием
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
