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

/** Пересекается ли период [start, end] (включительно) хотя бы с одной занятой бронью. */
export function rangeOverlaps(start: string, end: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => start <= r.end_date && end >= r.start_date);
}

export type Selection = { start: string; end: string };

/**
 * Выбор периода нажатиями в календаре: первое нажатие — начало, второе — конец.
 * Нажатие раньше начала или после завершённого выбора начинает выбор заново.
 * Повторное нажатие на начало — бронь на один день.
 */
export function pickDate(sel: Selection, day: string): Selection {
  if (!sel.start || sel.end || day < sel.start) return { start: day, end: '' };
  return { start: sel.start, end: day };
}

/** Количество для расчёта стоимости: дни — из периода, гектары и часы — из поля ввода. */
export function parseQty(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 0.1 && n <= 1000 ? n : null;
}

/**
 * Стоимость с округлением до дирама (0,01 сомони), половина — вверх.
 * Считаем в целых сотых: 2,5 × 33,33 в двоичной арифметике = 83,32499…, а должно быть 83,33.
 */
export function rentalCost(qty: number, price: number): number {
  const cents = Math.round(price * 100) * Math.round(qty * 100);
  return Math.round(cents / 100) / 100;
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