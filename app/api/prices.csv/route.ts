import { NextResponse } from 'next/server';
import { daysInclusive } from '@/lib/booking-rules';
import { todayInDushanbe } from '@/lib/format';
import { getT } from '@/lib/i18n-server';
import { buildCsv, isIsoDate, pickName, shiftDate } from '@/lib/prices-rules';
import { getPricesRange } from '@/lib/queries/prices-manage';

const bad = (msg: string) => new NextResponse(msg, { status: 400 });

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const to = q.get('to') ?? todayInDushanbe();
  const from = q.get('from') ?? shiftDate(isIsoDate(to) ? to : todayInDushanbe(), -29);
  if (!isIsoDate(from) || !isIsoDate(to)) return bad('bad date');

  const span = daysInclusive(from, to);
  if (span === null || span < 1 || span > 366) return bad('bad range');

  const rows = await getPricesRange(from, to, q.get('market') || null);
  if (rows === null) return bad('bad market');

  const { lang } = await getT();
  const csv = buildCsv(
    ['date', 'market', 'product', 'unit', 'price_tjs'],
    rows.map((r) => [
      r.price_date,
      pickName({ name_tj: r.market_tj, name_ru: r.market_ru, name_en: r.market_en }, lang),
      pickName({ name_tj: r.product_tj, name_ru: r.product_ru, name_en: r.product_en }, lang),
      r.unit ?? '',
      r.price,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="prices_${from}_${to}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}