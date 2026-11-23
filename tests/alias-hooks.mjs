// Импорты вида '@/lib/x' в тестах node:test: превращаем в путь к файлу проекта (как paths в tsconfig).
// Подключается в package.json: node --import ./tests/alias-hooks.mjs --test ...
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';

const root = new URL('../', import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const base = new URL(specifier.slice(2), root).href;
      for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
        if (existsSync(new URL(candidate))) return nextResolve(candidate, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
