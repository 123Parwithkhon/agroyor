// Телефоны Таджикистана: хранение +992XXXXXXXXX, показ +992 XX XXX XX XX.
// Чистые функции без зависимостей — работают на клиенте, сервере и в сиде.

/** Приводит ввод («90 123 45 67», «+992901234567», «992...») к +992XXXXXXXXX или null. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('992')) digits = digits.slice(3);
  if (digits.length !== 9) return null;
  return `+992${digits}`;
}

/** +992901234567 → +992 90 123 45 67 */
export function formatPhone(phone: string): string {
  const m = /^\+992(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return m ? `+992 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

export function telLink(phone: string): string {
  return `tel:${phone}`;
}

export function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}
