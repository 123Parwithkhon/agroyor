'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth-guards';
import { db } from '@/lib/db';
import { checkNeedDate, checkResponse, demandSchema, isNearRequest } from '@/lib/demand';
import type { FormState } from '@/lib/form-state';
import { formValues } from '@/lib/form-values';
import { todayInDushanbe } from '@/lib/format';
import { hitRateLimit } from '@/lib/rate-limit';
import { fieldErrors } from '@/lib/validation';

/** «Кинуть клич»: фермер описывает, какая техника нужна, где и когда. */
export async function createRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser('/requests/new');
  const values = formValues(formData, ['type', 'district', 'needDate', 'area', 'budget', 'note']);
  const parsed = demandSchema.safeParse(values);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  const r = parsed.data;
  const dateError = checkNeedDate(r.needDate, todayInDushanbe());
  if (dateError) return { fields: { needDate: dateError }, values };
  if (!(await hitRateLimit('demand', user.id))) return { error: 'err.rateLimited', values };

  await db()`
    INSERT INTO demand_requests (user_id, type, district, need_date, area_ha, budget_per_ha, note)
    VALUES (${user.id}, ${r.type}, ${r.district}, ${r.needDate}::date, ${r.area}, ${r.budget}, ${r.note})`;
  revalidatePath('/requests');
  revalidatePath('/me');
  redirect('/me?notice=request#my-requests');
}

/** Отклик владельца в один клик: «моя техника свободна». Проверки — на сервере, в транзакции. */
export async function respondAction(requestId: string, equipmentId: string, back: 'me' | 'requests'): Promise<void> {
  const page = back === 'me' ? '/me' : '/requests';
  const user = await requireUser(page);
  if (!/^\d{1,9}$/.test(requestId) || !/^\d{1,9}$/.test(equipmentId)) return;

  const error = await db().begin(async (tx) => {
    const [r] = await tx<{ type: string; district: string; need_date: string; closed: boolean; user_id: string }[]>`
      SELECT type, district, need_date, closed, user_id::text AS user_id
      FROM demand_requests WHERE id = ${requestId} FOR UPDATE`;
    const [e] = await tx<{ type: string; district: string; service_radius_km: number | null }[]>`
      SELECT type, district, service_radius_km FROM equipment
      WHERE id = ${equipmentId} AND owner_id = ${user.id} AND active AND NOT hidden_by_admin`;
    if (!r || !e) return 'err.unavailable';
    const [{ done } = { done: false }] = await tx<{ done: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM demand_responses WHERE request_id = ${requestId} AND equipment_id = ${equipmentId}) AS done`;
    const rule = checkResponse({
      closed: r.closed, needDate: r.need_date, today: todayInDushanbe(), authorId: r.user_id, userId: user.id,
      near: isNearRequest(e, r), alreadyResponded: done,
    });
    if (rule) return rule;
    await tx`INSERT INTO demand_responses (request_id, owner_id, equipment_id) VALUES (${requestId}, ${user.id}, ${equipmentId})`;
    return null;
  });

  revalidatePath('/requests');
  revalidatePath('/me');
  redirect(error ? `${page}?error=${encodeURIComponent(error)}#nearby` : `${page}?notice=responded#nearby`);
}

/** Автор закрывает запрос (технику нашёл). */
export async function closeRequestAction(requestId: string): Promise<void> {
  const user = await requireUser('/me');
  if (!/^\d{1,9}$/.test(requestId)) return;
  await db()`UPDATE demand_requests SET closed = true WHERE id = ${requestId} AND user_id = ${user.id}`;
  revalidatePath('/me');
  revalidatePath('/requests');
}
