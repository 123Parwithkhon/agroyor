import { GirihStar } from '@/components/ornaments';
import { getT } from '@/lib/i18n-server';

/** Показывается при переходах, пока сервер готовит страницу (важно на медленном 3G). */
export default async function Loading() {
  const { t } = await getT();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-lapis-900">
      <GirihStar className="animate-girih size-8 text-zar-500" />
      {t('common.loading')}
    </div>
  );
}
