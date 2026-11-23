import 'server-only';
import { DICTIONARIES } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Тексты ошибок форм на языке пользователя: { 'err.phoneInvalid': '…', … }.
 * Сервер возвращает из действий ключ ошибки, клиентская форма показывает текст по этому ключу.
 */
export async function authMessages(): Promise<Record<string, string>> {
  const dict = DICTIONARIES[await getLang()];
  return Object.fromEntries(Object.entries(dict).filter(([key]) => key.startsWith('err.')));
}
