import 'server-only';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { DEFAULT_LANG, getDictionary, isLang, LANG_COOKIE, type DictKey, type Lang, type T } from '@/lib/i18n';

/** Язык из cookie, по умолчанию таджикский. */
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function getT(): Promise<{ lang: Lang; t: T }> {
  const lang = await getLang();
  return { lang, t: getDictionary(lang) };
}

/** Заголовок вкладки браузера на языке пользователя: «<страница> — AgroYor». */
export async function pageMetadata(titleKey: DictKey): Promise<Metadata> {
  const { t } = await getT();
  return { title: t(titleKey) };
}
