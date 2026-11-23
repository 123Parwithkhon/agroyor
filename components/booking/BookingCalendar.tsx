import { isBooked, monthGrid, type DateRange, type Selection } from '@/lib/booking-rules';
import type { CalendarLabels } from '@/lib/calendar-labels';

type Props = {
  labels: CalendarLabels;
  booked: DateRange[];
  today: string;
  text: { busy: string; free: string; selected: string };
  /** Выбранный период (подсветка) */
  selected?: Selection;
  /** Если передан — свободные будущие дни можно нажимать (выбор дат для брони) */
  onPick?: (day: string) => void;
};

/**
 * Календарь занятости на два месяца. Без onPick — только просмотр (гость, владелец).
 * Занятые и прошедшие дни нажать нельзя.
 */
export default function BookingCalendar({ labels, booked, today, text, selected, onPick }: Props) {
  const inSelection = (d: string) =>
    !!selected?.start && (selected.end ? d >= selected.start && d <= selected.end : d === selected.start);

  return (
    <div className="space-y-4">
      <div className="grid gap-6 sm:grid-cols-2">
        {labels.months.map((month) => (
          <div key={`${month.year}-${month.month0}`}>
            <p className="mb-2 text-center font-semibold capitalize text-lapis-900">{month.title}</p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-600" aria-hidden="true">
              {labels.weekdays.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
              {monthGrid(month.year, month.month0).flat().map((d, i) => {
                if (!d) return <span key={`e${i}`} />;
                const busy = isBooked(d, booked);
                const past = d < today;
                const picked = inSelection(d);
                const cls = busy
                  ? 'bg-anor-50 font-semibold text-anor-700 line-through'
                  : past
                    ? 'text-stone-400'
                    : picked
                      ? 'bg-firuza-700 font-semibold text-white'
                      : 'bg-white';
                const ring = d === today && !picked ? 'ring-2 ring-firuza-700' : '';
                const status = busy ? text.busy : picked ? text.selected : past ? '' : text.free;
                const label = status ? `${d} — ${status}` : d;
                if (onPick && !busy && !past) {
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onPick(d)}
                      aria-label={label}
                      aria-pressed={picked}
                      className={`min-h-10 rounded ${cls} ${ring} hover:outline hover:outline-firuza-600`}
                    >
                      {Number(d.slice(8, 10))}
                    </button>
                  );
                }
                return (
                  <span key={d} className={`flex min-h-10 items-center justify-center rounded ${cls} ${ring}`} aria-label={label}>
                    {Number(d.slice(8, 10))}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1">
          <span className="rounded bg-anor-50 px-2 py-0.5 font-semibold text-anor-700 line-through">1</span>
          {text.busy}
        </span>
        {onPick && (
          <span className="inline-flex items-center gap-1">
            <span className="rounded bg-firuza-700 px-2 py-0.5 font-semibold text-white">1</span>
            {text.selected}
          </span>
        )}
      </p>
    </div>
  );
}
