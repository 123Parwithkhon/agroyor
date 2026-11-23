import Link from 'next/link';
import { GirihStar } from '@/components/ornaments';
import { formatMoney } from '@/lib/format';
import { localizedName, type Lang, type T } from '@/lib/i18n';
import type { PriceBoard } from '@/lib/queries/prices';

type Riser = { id: number; name: string; delta: number };

/** До двух продуктов с наибольшим ростом цены к прошлому дню (по любому рынку). */
export function topRisers(board: PriceBoard, lang: Lang, limit = 2): Riser[] {
  const out: Riser[] = [];
  for (const row of board.rows) {
    let best = 0;
    for (const cell of Object.values(row.cells)) {
      if (cell.price !== null && cell.prev !== null) best = Math.max(best, cell.price - cell.prev);
    }
    if (best > 0) out.push({ id: row.product.id, name: localizedName(row.product, lang), delta: Math.round(best * 100) / 100 });
  }
  return out.sort((a, b) => b.delta - a.delta).slice(0, limit);
}

/**
 * «Умная подсказка»: связывает цены с арендой. Если культура подорожала — фермеру выгодно
 * собрать и вывезти урожай быстрее; ссылки ведут в каталог по виду работ и району пользователя.
 */
export function SmartHints({ board, lang, t, district }: { board: PriceBoard; lang: Lang; t: T; district: string | null }) {
  const risers = topRisers(board, lang);
  if (risers.length === 0) return null;
  const link = (work: string) => {
    const q = new URLSearchParams({ work });
    if (district) q.set('district', district);
    return `/equipment?${q.toString()}`;
  };
  const btn = 'inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold';
  return (
    <section className="rounded-xl border-2 border-zar-300 bg-zar-50 p-4" aria-labelledby="smart-hint">
      <h2 id="smart-hint" className="flex items-center gap-2 font-bold text-lapis-900">
        <GirihStar className="size-5 text-anor-600" />
        {t('hint.title')}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {risers.map((r) => (
          <li key={r.id} className="rounded-full bg-white px-3 py-1 text-sm">
            <b>{r.name}</b> {t('hint.rose')} <b className="text-anor-700">+{formatMoney(r.delta, lang)}</b>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-stone-800">
        {t('hint.question')}
        {district && <span className="text-stone-600"> ({t('hint.inDistrict')})</span>}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href={link('harvesting')} className={`${btn} bg-firuza-700 text-white hover:bg-firuza-800`}>
          {t('hint.harvest')}
        </Link>
        <Link href={link('transport')} className={`${btn} border-2 border-firuza-700 bg-white text-firuza-800 hover:bg-firuza-50`}>
          {t('hint.transport')}
        </Link>
      </div>
    </section>
  );
}
