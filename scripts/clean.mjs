// npm run clean — удаляет кэш сборки .next (пересоздаётся сам при следующем npm run dev / build).
// База данных (.data/) и загруженные фото не затрагиваются.
import { rmSync } from 'node:fs';

rmSync('.next', { recursive: true, force: true });
rmSync('tsconfig.tsbuildinfo', { force: true });
console.log('Кэш .next удалён');
