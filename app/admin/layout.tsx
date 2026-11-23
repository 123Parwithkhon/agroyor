import Link from 'next/link';
import { requireRole } from '@/lib/auth-guards';
import { getT } from '@/lib/i18n-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin', '/admin');
  const { t } = await getT();
  const tab = 'inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium';

  return (
    <>
      <nav className="mx-auto flex w-full max-w-3xl flex-wrap gap-2 px-4 pt-6">
        <Link href="/admin" className={tab}>{t('admin.users')}</Link>
        <Link href="/admin/equipment" className={tab}>{t('admin.equipment')}</Link>
        <Link href="/admin/prices" className={tab}>{t('admin.prices')}</Link>
      </nav>
      {children}
    </>
  );
}