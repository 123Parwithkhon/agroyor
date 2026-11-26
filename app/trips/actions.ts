'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth-guards';
import { daysInclusive } from '@/lib/booking-rules';
import { db } from '@/lib/db';
import { DISTRICTS } from '@/lib/districts';
import { todayInDushanbe } from '@/lib/format';
import { hitRateLimit } from '@/lib/rate-limit';
import { parseTons } from '@/lib/trips';

/** Опубликовать рейс поле → рынок, чтобы попутчики с соседних полей могли разделить его стоимость. */
export async function createTripAction(formData: FormData): Promise<void> {
  const get = (k: string) => String(formData.get(k) ?? '');
  const params = new URLSearchParams({
    product: get('product'), tons: get('tons'), from: get('from'), market: get('market'), date: get('date'),
  });
  const back = `/trips?${params}`;
  const user = await requireUser(back);

  const tons = parseTons(get('tons'));
  const span = daysInclusive(todayInDushanbe(), get('date'));
  const ok =
    tons !== null &&
    /^\d{1,9}$/.test(get('product')) &&
    /^\d{1,9}$/.test(get('market')) &&
    DISTRICTS.some((d) => d.code === get('from')) &&
    span !== null && span >= 1 && span <= 60;
  if (!ok) redirect(`${back}&error=1`);
  if (!(await hitRateLimit('trip', user.id))) redirect(`${back}&error=rate`);

  await db()`
    INSERT INTO trips (user_id, product_id, tons, from_district, market_id, trip_date)
    SELECT ${user.id}, p.id, ${tons}, ${get('from')}, m.id, ${get('date')}::date
    FROM products p, markets m
    WHERE p.id = ${get('product')} AND p.active AND m.id = ${get('market')} AND m.active
    ON CONFLICT (user_id, trip_date, market_id)
      DO UPDATE SET product_id = EXCLUDED.product_id, tons = EXCLUDED.tons, from_district = EXCLUDED.from_district`;
  revalidatePath('/trips');
  redirect(`${back}&posted=1#fellows`);
}

/** Отменить свой рейс. */
export async function deleteTripAction(tripId: string): Promise<void> {
  const user = await requireUser('/trips');
  if (!/^\d{1,9}$/.test(tripId)) return;
  await db()`DELETE FROM trips WHERE id = ${tripId} AND user_id = ${user.id}`;
  revalidatePath('/trips');
}
