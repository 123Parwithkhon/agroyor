import { OrnateHeading } from '@/components/ornaments';
import PasswordForm from '@/components/auth/PasswordForm';
import { requireUser } from '@/lib/auth-guards';
import { authMessages } from '@/lib/auth-messages';
import { getT, pageMetadata } from '@/lib/i18n-server';

export const generateMetadata = () => pageMetadata('me.password');

export default async function PasswordPage() {
  await requireUser('/me/password');
  const { t } = await getT();
  const msgs = await authMessages();

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <OrnateHeading>{t('me.password')}</OrnateHeading>
      <div className="mt-6">
        <PasswordForm
          msgs={msgs}
          labels={{ current: t('me.passwordCurrent'), next: t('me.passwordNew'), save: t('me.passwordSave') }}
        />
      </div>
    </div>
  );
}