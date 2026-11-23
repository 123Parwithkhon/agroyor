'use server';

import { cookies } from 'next/headers';
import { isLang, LANG_COOKIE } from '@/lib/i18n';

/** Переключение языка: сохраняем выбор в cookie на год. */
export async function setLang(formData: FormData): Promise<void> {
  const lang = formData.get('lang');
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
