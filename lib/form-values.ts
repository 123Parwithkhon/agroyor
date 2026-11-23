export function formValues(fd: FormData, names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of names) out[n] = String(fd.get(n) ?? '');
  return out;
}