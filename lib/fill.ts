/** Подстановка в шаблон словаря: fill('Ҷамъ {a} аз {b}', { a: 1, b: 2 }). Неизвестные метки остаются как есть. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
