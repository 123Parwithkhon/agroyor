import type { MetadataRoute } from 'next';

/** Публичные страницы индексируются, личный кабинет и служебные разделы — нет. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/me', '/admin', '/reporter', '/api/'] },
  };
}
