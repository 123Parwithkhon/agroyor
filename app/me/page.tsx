import Link from 'next/link';
import { signOut } from '@/auth';
import { OrnateHeading } from '@/components/ornaments';
import BookingItem from '@/components/booking/BookingItem';
import { requireUser } from '@/lib/auth-guards';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { RequestCard } from '@/components/demand/RequestCard';
import { MyRequests } from '@/components/demand/MyRequests';
import { authMessages } from '@/lib/auth-messages';
import { getMyRequests, getNearbyRequests, markDemandSeen } from '@/lib/queries/demand';
import { closeRequestAction, respondAction } from '@/app/requests/actions';
import {
  getIncomingBookings,
  getMyBookings,
  markBookingsSeen,
  refreshDoneBookings,
} from '@/lib/queries/bookings';
import Icon from '@/components/landing/Icon';

export const generateMetadata = () => pageMetadata('page.me');

async function logoutAction(): Promise<void> {
  'use server';
  await signOut({ redirectTo: '/' });
}

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const user = await requireUser('/me');
  const { notice, error } = await searchParams;
  const { lang, t } = await getT();

  await refreshDoneBookings();
  const incoming = await getIncomingBookings(user.id);
  const mine = await getMyBookings(user.id);
  // Пользователь увидел изменения статусов — бейдж обнулится при следующем переходе
  await markBookingsSeen(user.id);
  // «Сигнал дефицита»: мои запросы с откликами и запросы фермеров рядом с моей техникой
  const myRequests = await getMyRequests(user.id);
  const nearby = await getNearbyRequests(user.id);
  await markDemandSeen(user.id);
  const msgs: Record<string, string> = error ? await authMessages() : {};

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
      {notice === 'request' && (
        <p role="status" className="rounded-lg bg-firuza-50 p-3 text-sm">{t('demand.sentNotice')}</p>
      )}
      {notice === 'responded' && (
        <p role="status" className="rounded-lg bg-firuza-50 p-3 text-sm">{t('demand.respondedNotice')}</p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-anor-50 p-3 text-sm text-anor-700">{msgs[error] ?? t('err.generic')}</p>
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

      {nearby.length > 0 && (
        <section id="nearby">
          <h2 className="text-lg font-semibold text-lapis-900"><Icon name="megaphone" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('demand.nearbyTitle')}</h2>
          <p className="text-sm text-stone-600">{t('demand.nearbyHint')}</p>
          <ul className="mt-3 grid gap-3">
            {nearby.map((r) => (
              <RequestCard key={r.id} r={r} lang={lang} t={t} options={r.options} isNew={r.is_new}
                respond={(eqId) => respondAction.bind(null, r.id, eqId, 'me')} />
            ))}
          </ul>
        </section>
      )}

      <section id="my-requests">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-lapis-900">{t('demand.myTitle')}</h2>
          <Link href="/requests/new" className={`${link} border-anor-600 text-anor-700`}><Icon name="megaphone" className="inline-block size-[1.1em] shrink-0 align-[-0.15em] me-1.5" />{t('demand.cta')}</Link>
        </div>
        <MyRequests list={myRequests} lang={lang} t={t} close={(id) => closeRequestAction.bind(null, id)} />
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
