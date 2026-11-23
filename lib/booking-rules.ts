export type DateRange = { start_date: string; end_date: string };

export const MAX_BOOKING_DAYS = 30;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function toUtc(s: string): number | null {
  if (!ISO.test(s)) return null;
  const ts = Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
  return new Date(ts).toISOString().slice(0, 10) === s ? ts : null;
}

// Число дней в брони, включая оба конца; null — даты неверны
export function daysInclusive(start: string, end: string): number | null {
  const a = toUtc(start);
  const b = toUtc(end);
  if (a === null || b === null) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

// Возвращает ключ ошибки из словаря или null, если даты подходят
export function checkBookingDates(start: string, end: string, today: string): string | null {
  const days = daysInclusive(start, end);
  if (days === null || days < 1) return 'err.datesInvalid';
  if (start < today) return 'err.datesPast';
  if (days > MAX_BOOKING_DAYS) return 'err.datesTooLong';
  return null;
}

export function isBooked(date: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => date >= r.start_date && date <= r.end_date);
}

// Сетка месяца: недели с понедельника, пустые ячейки — null. month0: 0–11
export function monthGrid(year: number, month0: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month0, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const mm = String(month0 + 1).padStart(2, '0');
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= total; d++) cells.push(`${year}-${mm}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// 'YYYY-MM-DD' → 'DD.MM.YYYY'
export function displayDate(s: string): string {
  return ISO.test(s) ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : s;
}