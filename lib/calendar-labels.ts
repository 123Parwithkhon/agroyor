// Подписи календаря считаются на сервере и передаются в клиентский компонент готовыми строками:
// иначе Intl на сервере и в браузере может по-разному отформатировать таджикскую локаль
// (ошибка гидратации React).
import type { Lang } from '@/lib/i18n';

export type CalendarMonth = { year: number; month0: number; title: string };
export type CalendarLabels = { months: CalendarMonth[]; weekdays: string[] };

function locale(lang: Lang): string {
  return lang === 'tj' ? 'tg' : lang;
}

/** Текущий и следующий месяц от даты today (YYYY-MM-DD), неделя с понедельника. */
export function calendarLabels(today: string, lang: Lang): CalendarLabels {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7)) - 1;
  const fmtMonth = new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const fmtDay = new Intl.DateTimeFormat(locale(lang), { weekday: 'short', timeZone: 'UTC' });
  const months = [
    { year: y, month0: m },
    m === 11 ? { year: y + 1, month0: 0 } : { year: y, month0: m + 1 },
  ].map((x) => ({ ...x, title: fmtMonth.format(new Date(Date.UTC(x.year, x.month0, 1))) }));
  // 1 января 2024 — понедельник
  const weekdays = Array.from({ length: 7 }, (_, i) => fmtDay.format(new Date(Date.UTC(2024, 0, 1 + i))));
  return { months, weekdays };
}
