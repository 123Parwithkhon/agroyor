// Выдать или снять роль пользователю по телефону.
//   npm run db:role -- 927663686 admin          — выдать роль
//   npm run db:role -- 927663686 admin --remove — снять роль
// Роли: reporter, admin (роль user есть у всех).
import { connectForScript } from './lib/local-db.mjs';
import { normalizePhone } from '../lib/phone.ts';

const ROLES = ['reporter', 'admin'];
const args = process.argv.slice(2);
const remove = args.includes('--remove');
const [rawPhone, role] = args.filter((a) => !a.startsWith('--'));

const phone = normalizePhone(rawPhone ?? '');
if (!phone || !ROLES.includes(role)) {
  console.error('Использование: npm run db:role -- <телефон> <reporter|admin> [--remove]');
  process.exit(1);
}

const { sql, close } = await connectForScript();
try {
  const rows = remove
    ? await sql`UPDATE users SET roles = array_remove(roles, ${role})
                WHERE phone = ${phone} RETURNING name, roles`
    : await sql`UPDATE users
                SET roles = (SELECT array_agg(DISTINCT r) FROM unnest(roles || ARRAY[${role}]::text[]) AS r)
                WHERE phone = ${phone} RETURNING name, roles`;
  if (rows.length === 0) {
    console.error(`Пользователь ${phone} не найден — сначала он должен зарегистрироваться на сайте`);
    process.exitCode = 1;
  } else {
    console.log(`${phone} (${rows[0].name}): роли ${rows[0].roles.join(', ')}`);
    console.log('Пользователю нужно выйти и войти заново, чтобы роль появилась в меню');
  }
} finally {
  await close();
}
