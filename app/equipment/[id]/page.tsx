import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EquipmentArt } from '@/components/EquipmentArt';
import { ArrowLeftIcon, ChatIcon, PhoneIcon, PinIcon } from '@/components/icons';
import { GirihStar, OrnateHeading } from '@/components/ornaments';
import { Rating } from '@/components/Rating';
import { districtName } from '@/lib/districts';
import { priceUnitKey, typeKey } from '@/lib/equipment';
import { formatAmount, formatDate, formatMoney } from '@/lib/format';
import { isWork, workKey } from '@/lib/works';
import BookingCalendar from '@/components/booking/BookingCalendar';
import BookingForm from '@/components/booking/BookingForm';
import { getCurrentUser } from '@/lib/auth-guards';
import { authMessages } from '@/lib/auth-messages';
import { calendarLabels } from '@/lib/calendar-labels';
import { getT } from '@/lib/i18n-server';
import { formatPhone, telLink, whatsappLink } from '@/lib/phone';
import { todayInDushanbe } from '@/lib/format';
import { getBookedRanges } from '@/lib/queries/bookings';
import { getEquipment, getUserReviews } from '@/lib/queries/equipment';
import { createBookingAction } from './actions';

type Props = { params: Promise<{ id: string }> };

/** id из адреса: только положительное целое, иначе 404 (без лишнего запроса к БД). */
function parseId(raw: string): number | null {
  if (!/^\d{1,9}$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const item = id ? await getEquipment(id) : null;
  const { t } = await getT();
  return { title: item ? item.title : t('notFound.title') };
}

export default async function EquipmentItemPage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const item = await getEquipment(id);
  if (!item) notFound();

  const { lang, t } = await getT();
  // Последовательно, а не Promise.all: локальная PGlite работает через одно соединение
  const reviews = await getUserReviews(item.owner_id, 5);
  const booked = await getBookedRanges(item.id);
  const user = await getCurrentUser();
  const isOwner = user?.id === String(item.owner_id);
  const today = todayInDushanbe();
  const calendar = calendarLabels(today, lang);
  const photo = item.photos[0];
  const works = item.works.filter(isWork);
  // Характеристики: показываем только заполненные владельцем
  const specs = (
    [
      [t('eq.width'), item.work_width_m],
      [t('eq.fuel'), item.fuel_l_per_h],
      [t('eq.power'), item.power_hp],
    ] as const
  )
    .filter((s): s is readonly [string, number] => s[1] !== null)
    .map(([label, value]) => [label, formatAmount(value, lang)] as const);

  return (
    <article className="flex flex-col gap-5">
      <Link href="/equipment" className="inline-flex min-h-11 items-center gap-1 self-start font-semibold text-firuza-700">
        <ArrowLeftIcon className="size-5" />
        {t('eq.back')}
      </Link>

      <div className="grid gap-5 lg:grid-cols-2">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={item.title} className="aspect-[16/10] w-full rounded-2xl object-cover" />
        ) : (
          <EquipmentArt type={item.type} className="aspect-[16/10] w-full rounded-2xl" />
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5 text-sm font-semibold">
            <span className="rounded-full bg-lapis-50 px-2.5 py-0.5 text-lapis-800">{t(typeKey(item.type))}</span>
            {item.with_operator && (
              <span className="rounded-full bg-firuza-50 px-2.5 py-0.5 text-firuza-800">{t('eq.withOperator')}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-lapis-900">{item.title}</h1>
          <p className="text-2xl font-bold text-firuza-800">
            {formatMoney(item.price, lang)}
            <span className="text-base font-medium text-stone-600"> / {t(priceUnitKey(item.price_unit))}</span>
          </p>
          <p className="inline-flex items-center gap-1 text-stone-700">
            <PinIcon className="size-5 text-anor-600" />
            {districtName(item.district, lang)}
            {item.service_radius_km && (
              <span className="text-stone-500">· {t('eq.radius')}: {item.service_radius_km}</span>
            )}
          </p>
          {works.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label={t('eq.work')}>
              {works.map((w) => (
                <li key={w}>
                  <Link href={`/equipment?work=${w}`} className="inline-flex min-h-8 items-center rounded-full border border-firuza-600 px-2.5 text-sm text-firuza-800 hover:bg-firuza-50">
                    {t(workKey(w))}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {specs.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl border border-sand-200 bg-white p-3 text-sm">
              {specs.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-stone-600">{label}</dt>
                  <dd className="text-right font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Владелец и связь с ним */}
          <div className="rounded-xl border border-sand-200 bg-white p-4">
            <p className="text-sm text-stone-600">{t('eq.owner')}</p>
            <p className="flex flex-wrap items-center gap-x-3 font-semibold text-lapis-900">
              {item.owner_name}
              <Rating value={item.owner_rating} count={item.owner_reviews} label={t('eq.rating')} />
            </p>
            <p className="text-sm text-stone-600 tabular-nums">{formatPhone(item.owner_phone)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={telLink(item.owner_phone)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-firuza-700 px-3 font-semibold text-white hover:bg-firuza-800"
              >
                <PhoneIcon className="size-5 shrink-0" />
                {t('eq.call')}
              </a>
              <a
                href={whatsappLink(item.owner_phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-firuza-700 px-3 font-semibold text-firuza-800 hover:bg-firuza-50"
              >
                <ChatIcon className="size-5 shrink-0" />
                {t('eq.whatsapp')}
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Бронирование: календарь занятых дней, выбор дат и расчёт стоимости */}
      <section className="flex flex-col gap-4">
        <OrnateHeading>{t('bk.title')}</OrnateHeading>
        {user && !isOwner ? (
          <BookingForm
            action={createBookingAction.bind(null, String(item.id))}
            msgs={await authMessages()}
            lang={lang}
            today={today}
            price={item.price}
            unit={item.price_unit}
            booked={booked}
            calendar={calendar}
            labels={{
              start: t('bk.start'), end: t('bk.end'), comment: t('bk.comment'), submit: t('bk.submit'),
              calcTitle: t('calc.title'), total: t('calc.total'), busy: t('calc.busy'), note: t('calc.note'),
              pickHint: t('calc.pickHint'),
              qty: item.price_unit === 'hectare' ? t('calc.qtyHa') : t('calc.qtyHours'),
              unitDays: t('calc.days'), unitHa: t('calc.ha'), unitHours: t('calc.hours'),
              calBusy: t('bk.busy'), calFree: t('calc.free'), calSelected: t('calc.selected'),
            }}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-sand-200 bg-white p-4">
              <BookingCalendar
                labels={calendar}
                booked={booked}
                today={today}
                text={{ busy: t('bk.busy'), free: t('calc.free'), selected: t('calc.selected') }}
              />
            </div>
            <div className="flex items-center justify-center rounded-xl border border-sand-200 bg-white p-4">
              {isOwner ? (
                <p className="text-center text-stone-600">{t('bk.ownHint')}</p>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(`/equipment/${item.id}`)}`}
                  className="flex min-h-14 w-full items-center justify-center rounded-xl bg-firuza-700 px-4 text-center font-semibold text-white hover:bg-firuza-800"
                >
                  {t('bk.loginToBook')}
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {item.description && (
        <section>
          <OrnateHeading>{t('eq.description')}</OrnateHeading>
          {/* Текст пользователя выводится как обычный текст — React экранирует его (защита от XSS) */}
          <p className="mt-2 whitespace-pre-line text-stone-800">{item.description}</p>
        </section>
      )}

      <section>
        <OrnateHeading>{t('eq.reviews')}</OrnateHeading>
        {reviews.length === 0 ? (
          <p className="mt-2 text-stone-600">{t('eq.noReviews')}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-sand-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-lapis-900">{r.author_name}</span>
                  <span className="flex items-center gap-0.5" aria-label={`${t('eq.rating')}: ${r.rating} / 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <GirihStar key={i} className={`size-4 ${i < r.rating ? 'text-zar-500' : 'text-sand-200'}`} />
                    ))}
                  </span>
                </div>
                {r.text && <p className="mt-1 text-stone-800">{r.text}</p>}
                <p className="mt-1 text-xs text-stone-500">{formatDate(r.created_at.toISOString(), lang)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
