// Применяет SQL-миграции из db/migrations по порядку имён. Каждая — в своей транзакции.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { connectForScript } from './lib/local-db.mjs';

const dir = path.resolve('db/migrations');
const { sql, close } = await connectForScript();

try {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`;
  const done = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const text = readFileSync(path.join(dir, file), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    console.log(`✔ ${file}`);
    applied++;
  }
  console.log(applied ? `Применено миграций: ${applied}` : 'Новых миграций нет');
} catch (err) {
  console.error('Ошибка миграции:', err);
  process.exitCode = 1;
} finally {
  await close();
}
