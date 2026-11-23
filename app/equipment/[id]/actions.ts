'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { formValues } from '@/lib/form-values';
import { requireUser } from '@/lib/auth-guards';
import { hitRateLimit } from '@/lib/rate-limit';
import { todayInDushanbe } from '@/lib/format';
import { checkBookingDates, parseQty } from '@/lib/booking-rules';
import { checkGroupRequest, checkJoin, parseArea } from '@/lib/group-rules';
import { bookingSchema, fieldErrors } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';

export async function createBookingAction(
  equipmentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // renter_id берём только из сессии
  const user = await requireUser(`/equipment/${equipmentId}`);
  if (!/^\d{1,9}$/.test(equipmentId)) return { error: 'err.unavailable' };

  const values: Record<string, string> = {
    ...formValues(formData, ['startDate', 'endDate', 'comment', 'qty', 'groupTarget']),
    group: formData.get('group') === 'on' ? 'on' : '',
  };
  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  const { startDate, endDate, comment } = parsed.data;

  const dateError = checkBookingDates(startDate, endDate, todayInDushanbe());
  if (dateError) return { fields: { startDate: dateError }, values };

  if (!(await hitRateLimit('booking', user.id))) return { error: 'err.rateLimited', values };

  const sql = db();
  const [owner] = await sql<{ owner_id: string; price_unit: 'day' | 'hour' | 'hectare' }[]>`
    SELECT e.owner_id::text AS owner_id, e.price_unit
    FROM equipment e JOIN users u ON u.id = e.owner_id
    WHERE e.id = ${equipmentId} AND e.active AND NOT e.hidden_by_admin AND NOT u.blocked
  `;
  if (!owner) return { error: 'err.unavailable', values };
  if (owner.owner_id === user.id) return { error: 'err.ownEquipment', values };

  // Площадь/часы — для техники с оплатой за гектар или час; пустое поле допустимо (кроме складчины)
  const qtyRaw = values.qty ?? '';
  const qty = owner.price_unit === 'day' || qtyRaw.trim() === '' ? null : parseQty(qtyRaw);
  if (owner.price_unit !== 'day' && qtyRaw.trim() !== '' && qty === null) {
    return { fields: { qty: 'err.qtyInvalid' }, values };
  }
  const groupOpen = values.group === 'on';
  const target = groupOpen ? parseQty(values.groupTarget ?? '') : null;
  const groupError = checkGroupRequest({ unit: owner.price_unit, open: groupOpen, qty, target });
  if (groupError) return { fields: { [groupError === 'err.qtyInvalid' ? 'qty' : 'groupTarget']: groupError }, values };

  const clash = await sql`
    SELECT 1 FROM bookings
    WHERE equipment_id = ${equipmentId} AND status = 'confirmed'
      AND daterange(start_date, end_date, '[]')
          && daterange(${startDate}::date, ${endDate}::date, '[]')
    LIMIT 1
  `;
  if (clash.length > 0) return { error: 'err.datesTaken', values };

  await sql`
    INSERT INTO bookings (equipment_id, renter_id, start_date, end_date, status, note, qty, group_open, group_target_ha)
    VALUES (${equipmentId}, ${user.id}, ${startDate}::date, ${endDate}::date, 'pending', ${comment},
            ${qty}, ${groupOpen}, ${target})
  `;
  revalidatePath(`/equipment/${equipmentId}`);
  revalidatePath('/me');
  redirect('/me?notice=sent');
}

/**
 * Присоединиться к совместному заказу (складчине) со своей площадью.
 * Проверки — на сервере, в транзакции с блокировкой строки брони (FOR UPDATE),
 * чтобы два одновременных нажатия не обошли правила.
 */
export async function joinGroupAction(
  equipmentId: string,
  bookingId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(`/equipment/${equipmentId}`);
  const values = { area: String(formData.get('area') ?? '') };
  if (!/^\d{1,9}$/.test(bookingId) || !/^\d{1,9}$/.test(equipmentId)) return { error: 'err.unavailable' };
  const area = parseArea(values.area);
  if (area === null) return { fields: { area: 'err.areaInvalid' }, values };
  if (!(await hitRateLimit('booking', user.id))) return { error: 'err.rateLimited', values };

  const error = await db().begin(async (tx) => {
    const [b] = await tx<{ group_open: boolean; status: string; end_date: string; renter_id: string; owner_id: string }[]>`
      SELECT b.group_open, b.status, b.end_date, b.renter_id::text AS renter_id, e.owner_id::text AS owner_id
      FROM bookings b JOIN equipment e ON e.id = b.equipment_id
      WHERE b.id = ${bookingId} AND b.equipment_id = ${equipmentId}
      FOR UPDATE OF b`;
    if (!b) return 'err.unavailable';
    const [{ joined } = { joined: false }] = await tx<{ joined: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM booking_joins WHERE booking_id = ${bookingId} AND user_id = ${user.id}) AS joined`;
    const rule = checkJoin({
      groupOpen: b.group_open, status: b.status, endDate: b.end_date, today: todayInDushanbe(),
      userId: user.id, renterId: b.renter_id, ownerId: b.owner_id, alreadyJoined: joined,
    });
    if (rule) return rule;
    await tx`INSERT INTO booking_joins (booking_id, user_id, area_ha) VALUES (${bookingId}, ${user.id}, ${area})`;
    return null;
  });
  if (error) return { error, values };

  revalidatePath(`/equipment/${equipmentId}`);
  revalidatePath('/me');
  return { notice: 'group.joinedNotice' };
}
