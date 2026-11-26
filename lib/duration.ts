import type { Lang, T } from '@/lib/i18n';
import { splitHours } from '@/lib/matcher';

/** Число для подписи: 0,5 / 0.5 без лишних нулей. */
export function num(n: number, lang: Lang): string {
  const s = String(Math.round(n * 100) / 100);
  return lang === 'en' ? s : s.replace('.', ',');
}

/** Часы работы → «40 мин», «2 ч 30 мин», «3 дн.» (дни — по 8 рабочих часов). */
export function durationText(hours: number, t: T): string {
  const d = splitHours(hours);
  if (d.days > 0) return `${d.days} ${t('dur.days')}`;
  if (d.hours === 0) return `${Math.max(1, d.minutes)} ${t('dur.minutes')}`;
  return d.minutes ? `${d.hours} ${t('dur.hours')} ${d.minutes} ${t('dur.minutes')}` : `${d.hours} ${t('dur.hours')}`;
}
