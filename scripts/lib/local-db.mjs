// Общие функции для скриптов: чтение .env, разбор DATABASE_URL, локальный PGlite-сервер.
import { existsSync, mkdirSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import postgres from 'postgres';

export function loadEnv() {
  if (existsSync('.env')) process.loadEnvFile('.env');
}

/**
 * DATABASE_URL вида pglite://.data/pglite — локальный PGlite (файл на диске),
 * иначе — обычная строка подключения PostgreSQL (Neon).
 */
export function resolveDb() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL не задан (см. .env.example)');
  if (raw.startsWith('pglite://')) {
    const dir = path.resolve(raw.slice('pglite://'.length) || '.data/pglite');
    const port = Number(process.env.PGLITE_PORT ?? 5433);
    return { local: true, dir, port, url: `postgres://postgres:postgres@127.0.0.1:${port}/postgres` };
  }
  return { local: false, url: raw };
}

function isPortBusy(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => { socket.end(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

/** Запускает PGlite как TCP-сервер Postgres, чтобы postgres.js работал с ним как с обычной БД. */
export async function startPgliteServer({ dir, port }) {
  const { PGlite } = await import('@electric-sql/pglite');
  const { btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist');
  const { PGLiteSocketServer } = await import('@electric-sql/pglite-socket');
  mkdirSync(dir, { recursive: true });
  const db = await PGlite.create({ dataDir: dir, extensions: { btree_gist } });
  const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 8 });
  await server.start();
  return {
    async stop() {
      await server.stop();
      await db.close();
    },
  };
}

/**
 * Подключение для скриптов. Если локальный PGlite-сервер не запущен (нет npm run dev),
 * поднимаем его на время работы скрипта.
 */
export async function connectForScript() {
  loadEnv();
  const cfg = resolveDb();
  let server = null;
  if (cfg.local && !(await isPortBusy(cfg.port))) {
    server = await startPgliteServer(cfg);
  }
  const sql = postgres(cfg.url, {
    max: 1,
    // Как в lib/db.ts: на pglite-socket служебный запрос типов вешает транзакции
    fetch_types: !cfg.local,
    onnotice: () => {},
  });
  return {
    sql,
    local: cfg.local,
    async close() {
      await sql.end({ timeout: 5 });
      if (server) await server.stop();
    },
  };
}

export { isPortBusy };
