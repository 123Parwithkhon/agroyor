import { isBooked, monthGrid, type DateRange } from '@/lib/booking-rules';

type Props = {
  booked: DateRange[];
  today: string;
  lang: 'tj' | 'ru' | 'en';
  labels: { busy: string };
};

function MonthView({ year, month0, booked, today, lang, busy }: {
  year: number; month0: number; booked: DateRange[]; today: string; lang: string; busy: string;
}) {
  const locale = lang === 'tj' ? 'tg' : lang;
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month0, 1)));
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const weeks = monthGrid(year, month0);

  return (
    <div>
      <p className="mb-2 text-center font-semibold capitalize">{title}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-600">
        {weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
        {weeks.flat().map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const busyDay = isBooked(d, booked);
          const past = d < today;
          const cls = busyDay
            ? 'bg-anor-50 font-semibold text-anor-700 line-through'
            : past
              ? 'text-stone-400'
              : 'bg-white';
          return (
            <span
              key={d}
              className={`rounded py-1.5 ${cls} ${d === today ? 'ring-2 ring-firuza-700' : ''}`}
              aria-label={busyDay ? `${d} (${busy})` : d}
            >
              {Number(d.slice(8, 10))}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingCalendar({ booked, today, lang, labels }: Props) {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7)) - 1;
  const next = m === 11 ? { year: y + 1, month0: 0 } : { year: y, month0: m + 1 };
  return (
    <div className="space-y-4">
      <div className="grid gap-6 sm:grid-cols-2">
        <MonthView year={y} month0={m} booked={booked} today={today} lang={lang} busy={labels.busy} />
        <MonthView {...next} booked={booked} today={today} lang={lang} busy={labels.busy} />
      </div>
      <p className="text-sm">
        <span className="rounded bg-anor-50 px-2 py-0.5 font-semibold text-anor-700 line-through">1</span>{' '}
        {labels.busy}
      </p>
    </div>
  );
}