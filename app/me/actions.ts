'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guards';
import { todayInDushanbe } from '@/lib/format';
import { confirmBooking } from '@/lib/booking-confirm';
import { reviewSchema } from '@/lib/validation';

// id брони из формы: только целое число, иначе запрос не выполняем
function bookingId(fd: FormData): string | null {
  const id = String(fd.get('id') ?? '');
  return /^\d{1,9}$/.test(id) ? id : null;
}

export async function confirmBookingAction(formData: FormData): Promise<void> {
  const user = await requireUser('/me');
  const id = bookingId(formData);
  if (!id) return;
  const result = await confirmBooking(db(), user.id, id, todayInDushanbe());
  revalidatePath('/me');
  revalidatePath('/equipment', 'layout');
  if (result === 'overlap') redirect('/me?notice=overlap');
}

export async function rejectBookingAction(formData: FormData): Promise<void> {
  const user = await requireUser('/me');
  const id = bookingId(formData);
  if (!id) return;
  await db()`
    UPDATE bookings b SET status = 'rejected', renter_seen = false, decided_at = now()
    FROM equipment e
    WHERE b.id = ${id} AND e.id = b.equipment_id AND e.owner_id = ${user.id}
      AND b.status = 'pending'
  `;
  revalidatePath('/me');
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const user = await requireUser('/me');
  const id = bookingId(formData);
  if (!id) return;
  await db()`
    UPDATE bookings SET status = 'cancelled', decided_at = now()
    WHERE id = ${id} AND renter_id = ${user.id} AND status IN ('pending', 'confirmed')
  `;
  revalidatePath('/me');
  revalidatePath('/equipment', 'layout');
}

// Отзыв только по брони done и только участником брони; адресат — вторая сторона
export async function reviewAction(formData: FormData): Promise<void> {
  const user = await requireUser('/me');
  const parsed = reviewSchema.safeParse({
    bookingId: String(formData.get('bookingId') ?? ''),
    rating: String(formData.get('rating') ?? ''),
    comment: String(formData.get('comment') ?? ''),
  });
  if (!parsed.success) return;
  const { bookingId: id, rating, comment } = parsed.data;

  const sql = db();
  const [b] = await sql<{ target: string }[]>`
    SELECT CASE WHEN b.renter_id = ${user.id} THEN e.owner_id ELSE b.renter_id END AS target
    FROM bookings b JOIN equipment e ON e.id = b.equipment_id
    WHERE b.id = ${id} AND b.status = 'done'
      AND (b.renter_id = ${user.id} OR e.owner_id = ${user.id})
  `;
  if (!b) return;
  await sql`
    INSERT INTO reviews (booking_id, author_id, target_user_id, rating, text)
    VALUES (${id}, ${user.id}, ${b.target}, ${rating}, ${comment})
    ON CONFLICT (booking_id, author_id) DO NOTHING
  `;
  revalidatePath('/me');
  revalidatePath('/equipment', 'layout');
}
