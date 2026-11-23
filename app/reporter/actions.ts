'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth-guards';
import { todayInDushanbe } from '@/lib/format';
import { parsePrice, shiftDate } from '@/lib/prices-rules';
import { listMarkets, listProducts, upsertPrices } from '@/lib/queries/prices-manage';
import type { FormState } from '@/lib/form-state';

// dayKey: 'today' или 'yesterday'; любая другая дата невозможна
export async function savePricesAction(
  marketId: string,
  dayKey: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const key = dayKey === 'yesterday' ? 'yesterday' : 'today';
  const today = todayInDushanbe();
  const date = key === 'yesterday' ? shiftDate(today, -1) : today;

  // reporter_id берём только из сессии
  const user = await requireRole('reporter', `/reporter?market=${marketId}`);
  const markets = await listMarkets(true);
  const products = await listProducts(true);
  if (!markets.some((m) => m.id === marketId)) return { error: 'err.generic' };

  const values: Record<string, string> = {};
  const fields: Record<string, string> = {};
  const entries: { productId: string; price: number }[] = [];

  for (const p of products) {
    const raw = String(formData.get(`p_${p.id}`) ?? '').trim();
    values[p.id] = raw;
    if (raw === '') continue;
    const parsed = parsePrice(raw);
    if (parsed.ok) entries.push({ productId: p.id, price: parsed.value });
    else fields[p.id] = 'err.pricesInvalid';
  }
  if (Object.keys(fields).length > 0) return { fields, values };
  if (entries.length === 0) return { error: 'err.pricesEmpty', values };

  await upsertPrices(marketId, date, user.id, entries);
  revalidatePath('/prices', 'layout');
  revalidatePath('/');
  redirect(`/reporter?market=${encodeURIComponent(marketId)}&d=${key}&saved=1`);
}