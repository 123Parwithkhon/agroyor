'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { hitRateLimit } from '@/lib/rate-limit';
import { safeNext } from '@/lib/safe-next';
import { formValues } from '@/lib/form-values';
import { fieldErrors, loginSchema } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ['phone']);
  const parsed = loginSchema.safeParse({
    phone: String(formData.get('phone') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  const { phone, password } = parsed.data;

  if (!(await hitRateLimit('login', phone))) return { error: 'err.rateLimited', values };

  // Блокировку показываем только тому, кто знает верный пароль
  const [u] = await db()<{ password_hash: string; blocked: boolean }[]>`
    SELECT password_hash, blocked FROM users WHERE phone = ${phone}
  `;
  if (u?.blocked && (await verifyPassword(password, u.password_hash))) {
    return { error: 'err.blocked', values };
  }

  const next = safeNext(String(formData.get('next') ?? ''));
  // Неверный пароль тоже считается попыткой (лимит выше), подробности не раскрываем
  try {
    await signIn('credentials', { phone, password, redirectTo: next });
  } catch (e) {
    if (e instanceof AuthError) return { error: 'err.badCredentials', values };
    throw e; // redirect() тоже бросает исключение — его нельзя глотать
  }
  return null;
}