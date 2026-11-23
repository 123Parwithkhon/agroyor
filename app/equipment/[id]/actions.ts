'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { formValues } from '@/lib/form-values';
import { requireUser } from '@/lib/auth-guards';
import { hitRateLimit } from '@/lib/rate-limit';
import { todayInDushanbe } from '@/lib/format';
import { checkBookingDates } from '@/lib/booking-rules';
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

  const values = formValues(formData, ['startDate', 'endDate', 'comment']);
  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  const { startDate, endDate, comment } = parsed.data;

  const dateError = checkBookingDates(startDate, endDate, todayInDushanbe());
  if (dateError) return { fields: { startDate: dateError }, values };

  if (!(await hitRateLimit('booking', user.id))) return { error: 'err.rateLimited', values };

  const sql = db();
  const [owner] = await sql<{ owner_id: string }[]>`
    SELECT e.owner_id::text AS owner_id
    FROM equipment e JOIN users u ON u.id = e.owner_id
    WHERE e.id = ${equipmentId} AND e.active AND NOT e.hidden_by_admin AND NOT u.blocked
  `;
  if (!owner) return { error: 'err.unavailable', values };
  if (owner.owner_id === user.id) return { error: 'err.ownEquipment', values };

  const clash = await sql`
    SELECT 1 FROM bookings
    WHERE equipment_id = ${equipmentId} AND status = 'confirmed'
      AND daterange(start_date, end_date, '[]')
          && daterange(${startDate}::date, ${endDate}::date, '[]')
    LIMIT 1
  `;
  if (clash.length > 0) return { error: 'err.datesTaken', values };

  await sql`
    INSERT INTO bookings (equipment_id, renter_id, start_date, end_date, status, note)
    VALUES (${equipmentId}, ${user.id}, ${startDate}::date, ${endDate}::date, 'pending', ${comment})
  `;
  revalidatePath('/me');
  redirect('/me?notice=sent');
}
