import Link from 'next/link';
import { signOut } from '@/auth';
import { OrnateHeading } from '@/components/ornaments';
import BookingItem from '@/components/booking/BookingItem';
import { requireUser } from '@/lib/auth-guards';
import { getT, pageMetadata } from '@/lib/i18n-server';
import {
  getIncomingBookings,
  getMyBookings,
  markBookingsSeen,
  refreshDoneBookings,
} from '@/lib/queries/bookings';

export const generateMetadata = () => pageMetadata('page.me');

async function logoutAction(): Promise<void> {
  'use server';
  await signOut({ redirectTo: '/' });
}

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser('/me');
  const { notice } = await searchParams;
  const { t } = await getT();

  await refreshDoneBookings();
  const incoming = await getIncomingBookings(user.id);
  const mine = await getMyBookings(user.id);
  // Пользователь увидел изменения статусов — бейдж обнулится при следующем переходе
  await markBookingsSeen(user.id);

  const link = 'inline-flex min-h-11 items-center rounded-lg border bg-white px-4 font-medium';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <OrnateHeading as="h1">{t('bk.cabinet')}</OrnateHeading>
      <p className="-mt-3 text-lg font-semibold text-lapis-900">{user.name}</p>

      {notice === 'sent' && (
        <p role="status" className="rounded-lg bg-firuza-50 p-3 text-sm">{t('bk.sent')}</p>
      )}
      {notice === 'overlap' && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{t('bk.noticeOverlap')}</p>
      )}
      {notice === 'pwchanged' && (
        <p role="status" className="rounded-lg bg-firuza-50 p-3 text-sm">{t('me.passwordChanged')}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/me/equipment" className={`${link} border-firuza-700 text-firuza-700`}>
          {t('eq.my')}
        </Link>
        {user.roles.includes('reporter') && (
          <Link href="/reporter" className={`${link} border-firuza-700 text-firuza-700`}>
            {t('nav.reporter')}
          </Link>
        )}
        {user.roles.includes('admin') && (
          <Link href="/admin" className={`${link} border-firuza-700 text-firuza-700`}>
            {t('nav.admin')}
          </Link>
        )}
        <Link href="/me/password" className={`${link} border-stone-300`}>
          {t('me.password')}
        </Link>
        <form action={logoutAction}>
          <button type="submit" className={`${link} border-stone-300`}>
            {t('auth.logout')}
          </button>
        </form>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-lapis-900">{t('bk.incoming')}</h2>
        {incoming.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">{t('bk.none')}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {incoming.map((b) => (
              <BookingItem key={b.id} b={b} role="owner" t={t} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-lapis-900">{t('bk.mine')}</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">{t('bk.none')}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {mine.map((b) => (
              <BookingItem key={b.id} b={b} role="renter" t={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
