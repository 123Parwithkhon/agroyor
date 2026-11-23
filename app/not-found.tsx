import Link from 'next/link';
import { SuzaniMedallion } from '@/components/ornaments';
import { getT } from '@/lib/i18n-server';

export default async function NotFound() {
  const { t } = await getT();
  return (
    <section className="flex flex-col items-center py-10 text-center">
      <SuzaniMedallion className="size-28 text-lapis-700 opacity-80" />
      <h1 className="mt-4 text-2xl font-bold text-lapis-900">{t('notFound.title')}</h1>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-firuza-700 px-5 font-semibold text-white hover:bg-firuza-800"
      >
        {t('notFound.back')}
      </Link>
    </section>
  );
}
