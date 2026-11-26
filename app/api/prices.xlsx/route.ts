import { NextResponse } from 'next/server';
import { daysInclusive } from '@/lib/booking-rules';
import { productUnitKey } from '@/lib/equipment';
import { todayInDushanbe } from '@/lib/format';
import { getT } from '@/lib/i18n-server';
import { isIsoDate, pickName, shiftDate } from '@/lib/prices-rules';
import { getPricesRange } from '@/lib/queries/prices-manage';
import { buildXlsx, XLSX_TYPE } from '@/lib/xlsx';

const bad = (msg: string) => new NextResponse(msg, { status: 400 });

// Цены рынков в Excel: ?from=&to= (до 366 дней, по умолчанию 30 дней) и необязательный ?market=
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const to = q.get('to') ?? todayInDushanbe();
  const from = q.get('from') ?? shiftDate(isIsoDate(to) ? to : todayInDushanbe(), -29);
  if (!isIsoDate(from) || !isIsoDate(to)) return bad('bad date');

  const span = daysInclusive(from, to);
  if (span === null || span < 1 || span > 366) return bad('bad range');

  const rows = await getPricesRange(from, to, q.get('market') || null);
  if (rows === null) return bad('bad market');

  const { lang, t } = await getT();
  const file = buildXlsx({
    name: t('xlsx.sheet'),
    columns: [
      { header: t('xlsx.date'), width: 12 },
      { header: t('xlsx.market'), width: 16 },
      { header: t('xlsx.product'), width: 20 },
      { header: t('xlsx.unit'), width: 8 },
      { header: t('xlsx.price'), width: 14, money: true },
    ],
    rows: rows.map((r) => [
      { date: r.price_date },
      pickName({ name_tj: r.market_tj, name_ru: r.market_ru, name_en: r.market_en }, lang),
      pickName({ name_tj: r.product_tj, name_ru: r.product_ru, name_en: r.product_en }, lang),
      r.unit ? t(productUnitKey(r.unit)) : '',
      r.price,
    ]),
  });

  return new NextResponse(Buffer.from(file), {
    headers: {
      'Content-Type': XLSX_TYPE,
      'Content-Disposition': `attachment; filename="prices_${from}_${to}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
