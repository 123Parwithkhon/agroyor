import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OrnateHeading } from '@/components/ornaments';
import RegisterForm from '@/components/auth/RegisterForm';
import { getCurrentUser } from '@/lib/auth-guards';
import { authMessages } from '@/lib/auth-messages';
import { DISTRICTS } from '@/lib/districts';
import { getT, pageMetadata } from '@/lib/i18n-server';

export const generateMetadata = () => pageMetadata('page.register');

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/me');

  const { lang, t } = await getT();
  const msgs = await authMessages();

  return (
    <div className="mx-auto w-full max-w-md">
      <OrnateHeading as="h1">{t('auth.register')}</OrnateHeading>
      <div className="mt-6">
        <RegisterForm
          msgs={msgs}
          districts={DISTRICTS.map((d) => ({ code: d.code, name: d[lang] }))}
          labels={{
            phone: t('auth.phone'),
            phoneHint: t('auth.phoneHint'),
            password: t('auth.password'),
            name: t('auth.name'),
            district: t('auth.district'),
            districtChoose: t('auth.districtChoose'),
            submit: t('auth.submitRegister'),
          }}
        />
      </div>
      <p className="mt-6 text-center text-sm">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-firuza-700 underline">
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
}
