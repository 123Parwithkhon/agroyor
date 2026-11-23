// Интеграционный тест подтверждения брони на настоящем Postgres.
// Поднимает свой PGlite в памяти (все миграции из db/migrations) на случайном порту, поэтому
// не зависит от npm run dev и не трогает базу разработки. Подключение — как в приложении (postgres.js).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import postgres from 'postgres';
import { confirmBooking } from '@/lib/booking-confirm';

const TODAY = '2026-11-22';
const migrations = new URL('../db/migrations/', import.meta.url);

let pg: PGlite;
let server: PGLiteSocketServer;
let sql: postgres.Sql;
let fx: { equipmentId: string; ownerId: string; renterId: string };

before(async () => {
  pg = await PGlite.create({ extensions: { btree_gist } });
  for (const file of readdirSync(migrations).filter((f) => f.endsWith('.sql')).sort()) {
    await pg.exec(readFileSync(new URL(file, migrations), 'utf8'));
  }
  const owner = await pg.query<{ id: number }>(
    `INSERT INTO users (phone, name, password_hash, district) VALUES ('+992900000101', 'Owner', 'x', 'khujand') RETURNING id`,
  );
  const renter = await pg.query<{ id: number }>(
    `INSERT INTO users (phone, name, password_hash, district) VALUES ('+992900000102', 'Renter', 'x', 'khujand') RETURNING id`,
  );
  const ownerId = owner.rows[0]!.id;
  const eq = await pg.query<{ id: number }>(
    `INSERT INTO equipment (owner_id, type, title, district, price, price_unit)
     VALUES ($1, 'tractor', 'Test', 'khujand', 100, 'day') RETURNING id`,
    [ownerId],
  );
  fx = { equipmentId: String(eq.rows[0]!.id), ownerId: String(ownerId), renterId: String(renter.rows[0]!.id) };

  server = new PGLiteSocketServer({ db: pg, port: 0, host: '127.0.0.1' });
  await server.start();
  const port = Number(server.getServerConn().split(':').at(-1));
  // Те же настройки, что в lib/db.ts для локального PGlite: date — строка, numeric — число
  sql = postgres(`postgres://postgres:postgres@127.0.0.1:${port}/postgres`, {
    max: 1,
    fetch_types: false,
    onnotice: () => {},
    types: {
      dateOnly: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
      numericAsNumber: { to: 1700, from: [1700], serialize: (x: number) => String(x), parse: (x: string) => Number(x) },
    },
  });
});

after(async () => {
  await sql?.end({ timeout: 5 });
  await server?.stop();
  await pg?.close();
});

async function addBooking(start: string, end: string): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO bookings (equipment_id, renter_id, start_date, end_date, status)
    VALUES (${fx.equipmentId}, ${fx.renterId}, ${start}::date, ${end}::date, 'pending')
    RETURNING id::text AS id
  `;
  if (!row) throw new Error('insert failed');
  return row.id;
}

const statusOf = async (id: string) =>
  (await sql<{ status: string }[]>`SELECT status FROM bookings WHERE id = ${id}`)[0]?.status;

test('confirmBooking подтверждает и автоматически отклоняет пересекающиеся заявки', async () => {
  const a = await addBooking('2030-05-10', '2030-05-15');
  const b = await addBooking('2030-05-14', '2030-05-20'); // пересекается с a
  const c = await addBooking('2030-06-01', '2030-06-03'); // не пересекается

  assert.equal(await confirmBooking(sql, fx.ownerId, a, TODAY), 'ok');
  assert.equal(await statusOf(a), 'confirmed');
  assert.equal(await statusOf(b), 'rejected');
  assert.equal(await statusOf(c), 'pending');

  // повторное подтверждение и подтверждение отклонённой
  assert.equal(await confirmBooking(sql, fx.ownerId, a, TODAY), 'state');
  assert.equal(await confirmBooking(sql, fx.ownerId, b, TODAY), 'state');
});

test('confirmBooking: чужая техника, пересечение с подтверждённой, прошлое и мусор', async () => {
  const d = await addBooking('2030-05-12', '2030-05-13'); // внутри уже подтверждённой брони
  assert.equal(await confirmBooking(sql, fx.renterId, d, TODAY), 'notfound');
  assert.equal(await confirmBooking(sql, fx.ownerId, d, TODAY), 'overlap');
  assert.equal(await statusOf(d), 'pending');

  const old = await addBooking('2026-11-01', '2026-11-02');
  assert.equal(await confirmBooking(sql, fx.ownerId, old, TODAY), 'past');

  assert.equal(await confirmBooking(sql, fx.ownerId, 'abc', TODAY), 'notfound');
  assert.equal(await confirmBooking(sql, fx.ownerId, '999999', TODAY), 'notfound');
});
