// npm run dev / npm run start:local: при pglite:// поднимает локальную БД, затем запускает next dev / next start.
// При выходе аккуратно закрывает PGlite, чтобы файлы базы в .data/ не повредились.
import { spawn } from 'node:child_process';
import { isPortBusy, loadEnv, resolveDb, startPgliteServer } from './lib/local-db.mjs';

loadEnv();
const cfg = resolveDb();
let server = null;
if (cfg.local) {
  if (await isPortBusy(cfg.port)) {
    console.log(`PGlite: порт ${cfg.port} уже занят — используем запущенный сервер`);
  } else {
    server = await startPgliteServer(cfg);
    console.log(`PGlite: ${cfg.dir} на 127.0.0.1:${cfg.port}`);
  }
}

// Первый аргумент — команда next: dev (по умолчанию) или start (проверка продакшен-сборки локально)
const [command = 'dev', ...nextArgs] = process.argv.slice(2);
if (command !== 'dev' && command !== 'start') {
  console.error(`Неизвестная команда: ${command} (ожидается dev или start)`);
  process.exit(1);
}
const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', command, ...nextArgs], {
  stdio: 'inherit',
});

let stopping = false;
async function shutdown(code) {
  if (stopping) return;
  stopping = true;
  try {
    if (server) await server.stop();
  } finally {
    process.exit(code ?? 0);
  }
}

next.on('error', (err) => {
  console.error('Не удалось запустить next dev:', err.message);
  void shutdown(1);
});
next.on('exit', (code) => void shutdown(code));
// SIGHUP — закрытие окна терминала (в том числе на Windows)
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    if (next.exitCode === null) next.kill(signal);
    else void shutdown(0);
  });
}
