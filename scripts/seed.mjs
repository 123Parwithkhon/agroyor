// Начальные данные: рынки, продукты, админ из ADMIN_PHONE/ADMIN_PASSWORD.
// Флаг --demo (только для локальной PGlite) добавляет демо-пользователей, технику и цены за 30 дней.
import { DEMO_BOOKINGS, DEMO_EQUIPMENT, DEMO_USERS, MARKET_FACTORS } from './lib/demo-data.mjs';
import { connectForScript } from './lib/local-db.mjs';
import { todayInDushanbe } from '../lib/format.ts';
import { hashPassword } from '../lib/password.ts';
import { normalizePhone } from '../lib/phone.ts';

const PLACEHOLDER_PASSWORD = 'change-me-please';

const demo = process.argv.includes('--demo');
const { sql, local, close } = await connectForScript();

const MARKETS = [
  { tj: 'Хуҷанд', ru: 'Худжанд', en: 'Khujand' },
  { tj: 'Истаравшан', ru: 'Истаравшан', en: 'Istaravshan' },
  { tj: 'Исфара', ru: 'Исфара', en: 'Isfara' },
];

const PRODUCTS = [
  { tj: 'Пиёз', ru: 'Лук', en: 'Onion', base: 3 },
  { tj: 'Картошка', ru: 'Картофель', en: 'Potato', base: 4 },
  { tj: 'Сабзӣ', ru: 'Морковь', en: 'Carrot', base: 3 },
  { tj: 'Помидор', ru: 'Помидор', en: 'Tomato', base: 8 },
  { tj: 'Себ', ru: 'Яблоки', en: 'Apples', base: 7 },
  { tj: 'Қайса', ru: 'Курага', en: 'Dried apricots', base: 35 },
  { tj: 'Орд', ru: 'Мука', en: 'Flour', base: 6 },
  { tj: 'Гӯшти гов', ru: 'Говядина', en: 'Beef', base: 75 },
];

async function seedMarkets() {
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM markets`;
  if (count > 0) return console.log('Рынки уже есть — пропускаю');
  for (const [i, m] of MARKETS.entries()) {
    await sql`INSERT INTO markets (name_tj, name_ru, name_en, sort_order) VALUES (${m.tj}, ${m.ru}, ${m.en}, ${i + 1})`;
  }
  console.log(`✔ Рынки: ${MARKETS.length}`);
}

async function seedProducts() {
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM products`;
  if (count > 0) return console.log('Продукты уже есть — пропускаю');
  for (const [i, p] of PRODUCTS.entries()) {
    await sql`INSERT INTO products (name_tj, name_ru, name_en, unit, sort_order) VALUES (${p.tj}, ${p.ru}, ${p.en}, 'kg', ${i + 1})`;
  }
  console.log(`✔ Продукты: ${PRODUCTS.length}`);
}

async function seedAdmin() {
  const phone = normalizePhone(process.env.ADMIN_PHONE ?? '');
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!phone || password.length < 8) {
    throw new Error('Задайте ADMIN_PHONE (+992XXXXXXXXX) и ADMIN_PASSWORD (не короче 8 символов) в .env');
  }
  if (password === PLACEHOLDER_PASSWORD) {
    // Пароль из .env.example в продакшене = открытая админка
    if (!local) throw new Error('ADMIN_PASSWORD всё ещё из .env.example — задайте свой пароль');
    console.warn('⚠ ADMIN_PASSWORD из .env.example — годится только для локальной разработки');
  }
  const hash = await hashPassword(password);
  // Существующему пользователю только добавляем роль admin, пароль не трогаем
  await sql`
    INSERT INTO users (phone, name, password_hash, district, roles)
    VALUES (${phone}, 'Admin', ${hash}, 'khujand', ARRAY['user', 'admin'])
    ON CONFLICT (phone) DO UPDATE
      SET roles = (SELECT array_agg(DISTINCT r) FROM unnest(users.roles || ARRAY['admin']) AS r)`;
  console.log(`✔ Админ: ${phone}`);
}

async function upsertDemoUser(phone, name, district, roles, hash) {
  const [row] = await sql`
    INSERT INTO users (phone, name, password_hash, district, roles)
    VALUES (${phone}, ${name}, ${hash}, ${district}, ${roles})
    ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
    RETURNING id`;
  return row.id;
}

/** 'YYYY-MM-DD' со смещением в днях от сегодняшнего дня по Душанбе. */
function dayOffset(days) {
  const today = new Date(`${todayInDushanbe()}T00:00:00Z`);
  return new Date(today.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** Детерминированный «шум» 0..1 — одинаковые цены при каждом запуске, но без гладкой синусоиды. */
function noise(a, b, c) {
  const x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

async function seedDemoUsers(hash) {
  const ids = new Map();
  for (const u of DEMO_USERS) {
    ids.set(u.n, await upsertDemoUser(`+99290000000${u.n}`, u.name, u.district, u.roles, hash));
  }
  console.log(`✔ Демо-пользователи: ${ids.size} (пароль: demo1234)`);
  return ids;
}

async function seedDemoEquipment(userIds) {
  const ids = new Map();
  let added = 0;
  // Порядок вставки задаёт «свежесть»: первые в списке — самые новые
  for (const [i, e] of DEMO_EQUIPMENT.entries()) {
    const ownerId = userIds.get(e.owner);
    const [existing] = await sql`SELECT id FROM equipment WHERE owner_id = ${ownerId} AND title = ${e.title}`;
    if (existing) {
      // Обновляем описание и цену у ранее созданных демо-объявлений
      await sql`
        UPDATE equipment SET description = ${e.description}, price = ${e.price}, price_unit = ${e.unit},
               with_operator = ${e.op}, type = ${e.type}, district = ${e.district}
        WHERE id = ${existing.id}`;
      ids.set(e.key, existing.id);
      continue;
    }
    const [row] = await sql`
      INSERT INTO equipment (owner_id, type, title, description, district, price, price_unit, with_operator, created_at)
      VALUES (${ownerId}, ${e.type}, ${e.title}, ${e.description}, ${e.district}, ${e.price}, ${e.unit}, ${e.op},
              now() - make_interval(hours => ${i * 7}))
      RETURNING id`;
    ids.set(e.key, row.id);
    added++;
  }
  console.log(`✔ Демо-техника: ${DEMO_EQUIPMENT.length} (новых ${added})`);
  return ids;
}

async function seedDemoBookings(userIds, equipmentIds) {
  const demoEquipment = [...equipmentIds.values()];
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM bookings WHERE equipment_id = ANY(${demoEquipment})`;
  if (count > 0) return console.log('Демо-брони уже есть — пропускаю');

  let reviews = 0;
  for (const b of DEMO_BOOKINGS) {
    const equipmentId = equipmentIds.get(b.eq);
    const renterId = userIds.get(b.renter);
    const [{ owner_id: ownerId }] = await sql`SELECT owner_id FROM equipment WHERE id = ${equipmentId}`;
    const decided = b.status === 'pending' ? null : dayOffset(Math.min(b.from - 2, -1));
    const [booking] = await sql`
      INSERT INTO bookings (equipment_id, renter_id, start_date, end_date, status, note, created_at, decided_at)
      VALUES (${equipmentId}, ${renterId}, ${dayOffset(b.from)}, ${dayOffset(b.to)}, ${b.status}, ${b.note},
              ${dayOffset(Math.min(b.from - 3, -1))}::timestamptz, ${decided}::timestamptz)
      RETURNING id`;
    for (const r of b.reviews ?? []) {
      const author = r.by === 'renter' ? renterId : ownerId;
      const target = r.by === 'renter' ? ownerId : renterId;
      await sql`
        INSERT INTO reviews (booking_id, author_id, target_user_id, rating, text, created_at)
        VALUES (${booking.id}, ${author}, ${target}, ${r.rating}, ${r.text}, ${dayOffset(b.to + 1)}::timestamptz)`;
      reviews++;
    }
  }
  console.log(`✔ Демо-брони: ${DEMO_BOOKINGS.length}, отзывы: ${reviews}`);
}

async function seedDemoPrices(reporterId) {
  const markets = await sql`SELECT id FROM markets ORDER BY id`;
  const products = await sql`SELECT id, sort_order FROM products ORDER BY sort_order`;
  const rows = [];
  for (let day = 29; day >= 0; day--) {
    const date = dayOffset(-day);
    for (const [mi, m] of markets.entries()) {
      for (const p of products) {
        const base = PRODUCTS[p.sort_order - 1]?.base ?? 10;
        // Плавный тренд за месяц + ежедневный шум ±6% + разница рынков
        const trend = 1 + 0.07 * Math.sin((29 - day + p.id * 5) / 6);
        const daily = 1 + (noise(p.id, mi, day) - 0.5) * 0.12;
        const price = Math.round(base * trend * daily * (MARKET_FACTORS[mi] ?? 1) * 4) / 4;
        rows.push({ market_id: m.id, product_id: p.id, date, price, reporter_id: reporterId });
      }
    }
  }
  // Демо-цены демо-репортёра перезаписываются; цены других репортёров не трогаем
  const result = await sql`
    INSERT INTO prices ${sql(rows, 'market_id', 'product_id', 'date', 'price', 'reporter_id')}
    ON CONFLICT (market_id, product_id, date) DO UPDATE SET price = EXCLUDED.price
    WHERE prices.reporter_id = ${reporterId}`;
  console.log(`✔ Демо-цены: ${result.count} записей за 30 дней`);
}

async function seedDemo() {
  const hash = await hashPassword('demo1234');
  const userIds = await seedDemoUsers(hash);
  const equipmentIds = await seedDemoEquipment(userIds);
  await seedDemoBookings(userIds, equipmentIds);
  await seedDemoPrices(userIds.get(3));
}

try {
  if (demo && !local) throw new Error('--demo разрешён только для локальной БД (DATABASE_URL=pglite://...)');
  await seedMarkets();
  await seedProducts();
  await seedAdmin();
  if (demo) await seedDemo();
} catch (err) {
  console.error('Ошибка сида:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await close();
}
