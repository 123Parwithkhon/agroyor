import 'server-only';
import postgres from 'postgres';

export type Sql = postgres.Sql;

/**
 * DATABASE_URL:
 *  - pglite://.data/pglite — локальный PGlite, его поднимает `npm run dev` на 127.0.0.1:PGLITE_PORT;
 *  - postgres://...        — Neon (продакшен).
 */
function resolveUrl(): { url: string; local: boolean } {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL не задан (см. .env.example)');
  if (raw.startsWith('pglite://')) {
    const port = Number(process.env.PGLITE_PORT ?? 5433);
    return { url: `postgres://postgres:postgres@127.0.0.1:${port}/postgres`, local: true };
  }
  return { url: raw, local: false };
}

function createSql(): Sql {
  const { url, local } = resolveUrl();
  return postgres(url, {
    // Локально — строго одно соединение: PGlite однопользовательский, а его TCP-мультиплексор
    // путает ответы при параллельных запросах из нескольких соединений (страница получала
    // пустой результат, пока generateMetadata выполнял тот же запрос). На Neon — обычный пул.
    max: local ? 1 : 3,
    // Локально без служебного запроса типов массивов: на pglite-socket после него зависают
    // транзакции и запросы с enum-колонками (подтверждение брони вешало соединение).
    // Массивы встроенных типов (text[] у roles и photos) postgres.js разбирает и без него.
    fetch_types: !local,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
    // Свои имена ключей, чтобы не затереть встроенный тип `date` postgres.js (timestamptz ↔ Date)
    types: {
      // date → строка 'YYYY-MM-DD' (без сдвигов часовых поясов)
      dateOnly: {
        to: 1082,
        from: [1082],
        serialize: (x: string) => x,
        parse: (x: string) => x,
      },
      // numeric → number (цены и суммы небольшие, точности double хватает)
      numericAsNumber: {
        to: 1700,
        from: [1700],
        serialize: (x: number) => String(x),
        parse: (x: string) => Number(x),
      },
    },
  });
}

// Одно подключение на процесс; в dev переживает горячую перезагрузку модулей
const globalForDb = globalThis as typeof globalThis & { __agroyorSql?: Sql };

/** Подключение к БД создаётся при первом запросе, а не при импорте (сборка не требует БД). */
export function db(): Sql {
  globalForDb.__agroyorSql ??= createSql();
  return globalForDb.__agroyorSql;
}
