import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OrnateHeading } from '@/components/ornaments';
import LoginForm from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/auth-guards';
import { authMessages } from '@/lib/auth-messages';
import { getT, pageMetadata } from '@/lib/i18n-server';
import { safeNext } from '@/lib/safe-next';

export const generateMetadata = () => pageMetadata('page.login');

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getCurrentUser()) redirect(target);

  const { t } = await getT();
  const msgs = await authMessages();

  return (
    <div className="mx-auto w-full max-w-md">
      <OrnateHeading as="h1">{t('auth.login')}</OrnateHeading>
      <div className="mt-6">
        <LoginForm
          next={target}
          msgs={msgs}
          labels={{
            phone: t('auth.phone'),
            phoneHint: t('auth.phoneHint'),
            password: t('auth.password'),
            submit: t('auth.submitLogin'),
          }}
        />
      </div>
      <p className="mt-6 text-center text-sm">
        {t('auth.noAccount')}{' '}
        <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-firuza-700 underline">
          {t('auth.register')}
        </Link>
      </p>
    </div>
  );
}
