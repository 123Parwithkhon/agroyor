import Link from 'next/link';
import { Sparkline } from '@/components/prices/Sparkline';
import { productUnitKey } from '@/lib/equipment';
import { formatAmount, formatDate } from '@/lib/format';
import { localizedName, type Lang, type T } from '@/lib/i18n';
import type { PriceBoard } from '@/lib/queries/prices';

/** Стрелка к прошлому дню: ↑ гранат (подорожало), ↓ бирюза (подешевело), = без изменений. */
function Trend({ price, prev, t }: { price: number; prev: number | null; t: T }) {
  if (prev === null) return null;
  if (price > prev) {
    return (
      <span className="text-anor-600" title={t('prices.up')}>
        ▲<span className="sr-only">{t('prices.up')}</span>
      </span>
    );
  }
  if (price < prev) {
    return (
      <span className="text-firuza-700" title={t('prices.down')}>
        ▼<span className="sr-only">{t('prices.down')}</span>
      </span>
    );
  }
  return (
    <span className="text-stone-400" title={t('prices.same')}>
      =<span className="sr-only">{t('prices.same')}</span>
    </span>
  );
}

type Props = {
  board: PriceBoard;
  lang: Lang;
  t: T;
  /** Средние цены за 7 дней по продуктам — мини-график под названием (необязательно) */
  trend?: Record<number, number[]>;
};

export function PriceTable({ board, lang, t, trend }: Props) {
  if (!board.date || board.rows.length === 0) {
    return <p className="rounded-xl border border-sand-200 bg-white p-5 text-center text-stone-600">{t('common.noData')}</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm">
      <p className="flex flex-wrap justify-between gap-x-3 border-b border-sand-200 bg-sand-100 px-3 py-2 text-sm text-stone-700">
        <span>
          {t('prices.date')}: <b className="text-lapis-900">{formatDate(board.date, lang)}</b>
        </span>
        <span>{t('prices.currency')}</span>
      </p>
      {/* На узком экране таблица прокручивается вбок, колонка продукта закреплена.
          relative обязателен: иначе скрытые подписи sr-only (position: absolute) у стрелок
          выходят из-под обрезки и раздвигают всю страницу на телефоне. */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[19rem] text-sm">
          <thead>
            <tr className="text-left text-stone-600">
              <th scope="col" className="sticky left-0 bg-white px-3 py-2 font-semibold">
                {t('prices.product')}
              </th>
              {board.markets.map((m) => (
                <th key={m.id} scope="col" className="px-2 py-2 text-right font-semibold text-lapis-900">
                  {localizedName(m, lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.rows.map((row) => (
              <tr key={row.product.id} className="border-t border-sand-100 bg-white odd:bg-sand-50">
                <th scope="row" className="sticky left-0 bg-inherit px-3 py-2.5 text-left font-semibold">
                  <Link href={`/prices/${row.product.id}`} className="text-lapis-900 underline-offset-2 hover:underline">
                    {localizedName(row.product, lang)}
                  </Link>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs font-normal whitespace-nowrap text-stone-500">
                    1 {t(productUnitKey(row.product.unit))}
                    {trend?.[row.product.id] && (
                      <Link href={`/prices/${row.product.id}?days=7`} aria-label={`${t('prc.openChart')}: ${localizedName(row.product, lang)}`}>
                        <Sparkline values={trend[row.product.id] ?? []} label={`${t('prc.week')}: ${localizedName(row.product, lang)}`} />
                      </Link>
                    )}
                  </span>
                </th>
                {board.markets.map((m) => {
                  const cell = row.cells[m.id];
                  return (
                    <td key={m.id} className="px-2 py-2.5 text-right whitespace-nowrap tabular-nums">
                      {cell?.price != null ? (
                        <span className="inline-flex items-center gap-1">
                          {formatAmount(cell.price, lang)}
                          <Trend price={cell.price} prev={cell.prev} t={t} />
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
