import type { Sql } from '@/lib/db';

export type ConfirmResult = 'ok' | 'notfound' | 'state' | 'past' | 'overlap';

type Row = { id: string; status: string; equipment_id: string; start_date: string; end_date: string };

// Внутри транзакции использовать только tx: при локальном max: 1 любой другой запрос зависнет
export async function confirmBooking(
  sql: Sql,
  ownerId: string,
  bookingId: string,
  today: string,
): Promise<ConfirmResult> {
  if (!/^\d{1,9}$/.test(bookingId)) return 'notfound';
  try {
    const result = await sql.begin(async (tx): Promise<ConfirmResult> => {
      const [b] = await tx<Row[]>`
        SELECT b.id, b.status, b.equipment_id, b.start_date, b.end_date
        FROM bookings b JOIN equipment e ON e.id = b.equipment_id
        WHERE b.id = ${bookingId} AND e.owner_id = ${ownerId}
        FOR UPDATE OF b
      `;
      if (!b) return 'notfound';
      if (b.status !== 'pending') return 'state';
      if (b.end_date < today) return 'past';

      // Очередь подтверждений одной техники
      await tx`SELECT id FROM equipment WHERE id = ${b.equipment_id} FOR UPDATE`;

      const clash = await tx`
        SELECT 1 FROM bookings
        WHERE equipment_id = ${b.equipment_id} AND status = 'confirmed' AND id <> ${b.id}
          AND daterange(start_date, end_date, '[]')
              && daterange(${b.start_date}::date, ${b.end_date}::date, '[]')
        LIMIT 1
      `;
      if (clash.length > 0) return 'overlap';

      await tx`UPDATE bookings SET status = 'confirmed', renter_seen = false, decided_at = now() WHERE id = ${b.id}`;
      // Пересекающиеся заявки в ожидании отклоняются автоматически
      await tx`
        UPDATE bookings SET status = 'rejected', renter_seen = false, decided_at = now()
        WHERE equipment_id = ${b.equipment_id} AND status = 'pending' AND id <> ${b.id}
          AND daterange(start_date, end_date, '[]')
              && daterange(${b.start_date}::date, ${b.end_date}::date, '[]')
      `;
      return 'ok';
    });
    return result;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === '23P01') return 'overlap'; // сработал exclusion constraint
    throw e;
  }
}