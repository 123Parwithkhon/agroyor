import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Проверка работоспособности: отвечает ok и счётчики, если база доступна. */
export async function GET(): Promise<Response> {
  try {
    const [row] = await db()<{ markets: number; products: number }[]>`
      SELECT (SELECT count(*)::int FROM markets) AS markets,
             (SELECT count(*)::int FROM products) AS products`;
    return Response.json({ ok: true, ...row });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
