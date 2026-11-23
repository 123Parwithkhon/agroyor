import Link from 'next/link';
import { EquipmentArt } from '@/components/EquipmentArt';
import { PinIcon } from '@/components/icons';
import { Rating } from '@/components/Rating';
import { districtName } from '@/lib/districts';
import { priceUnitKey, typeKey } from '@/lib/equipment';
import { formatMoney } from '@/lib/format';
import type { Lang, T } from '@/lib/i18n';
import type { EquipmentListItem } from '@/lib/queries/equipment';

/** Карточка объявления в каталоге и на главной: картинка, вид, название, цена, район, рейтинг владельца. */
export function EquipmentCard({ item, lang, t }: { item: EquipmentListItem; lang: Lang; t: T }) {
  const photo = item.photos[0];
  return (
    <Link
      href={`/equipment/${item.id}`}
      // На телефоне карточка горизонтальная (картинка слева) — больше объявлений на экране;
      // с 640px — вертикальная, картинка сверху
      className="group flex overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-col"
    >
      {photo ? (
        // Фото из Vercel Blob (сжаты на клиенте до ~1280px)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          className="w-28 shrink-0 object-cover sm:aspect-[16/10] sm:w-full"
          loading="lazy"
        />
      ) : (
        <EquipmentArt type={item.type} className="w-28 shrink-0 sm:aspect-[16/10] sm:w-full" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-lapis-50 px-2 py-0.5 text-lapis-800">{t(typeKey(item.type))}</span>
          {item.with_operator && (
            <span className="rounded-full bg-firuza-50 px-2 py-0.5 text-firuza-800">{t('eq.withOperator')}</span>
          )}
        </div>
        <h3 className="font-bold text-lapis-900 group-hover:underline">{item.title}</h3>
        <p className="text-lg font-bold text-firuza-800">
          {formatMoney(item.price, lang)}
          <span className="text-sm font-medium text-stone-600"> / {t(priceUnitKey(item.price_unit))}</span>
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1 text-sm text-stone-600">
          <span className="inline-flex items-center gap-1">
            <PinIcon className="size-4 shrink-0 text-anor-600" />
            {districtName(item.district, lang)}
          </span>
          <Rating value={item.owner_rating} count={item.owner_reviews} label={t('eq.rating')} />
        </div>
      </div>
    </Link>
  );
}
