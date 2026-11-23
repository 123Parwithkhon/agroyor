'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { hitRateLimit } from '@/lib/rate-limit';
import { formValues } from '@/lib/form-values';
import { fieldErrors, registerSchema } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';

function isUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505';
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ['name', 'phone', 'district']);
  const parsed = registerSchema.safeParse({
    phone: String(formData.get('phone') ?? ''),
    password: String(formData.get('password') ?? ''),
    name: String(formData.get('name') ?? ''),
    district: String(formData.get('district') ?? ''),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  const { phone, password, name, district } = parsed.data;

  if (!(await hitRateLimit('register', phone))) return { error: 'err.rateLimited', values };

  const passwordHash = await hashPassword(password);
  try {
    await db()`
      INSERT INTO users (phone, password_hash, name, district)
      VALUES (${phone}, ${passwordHash}, ${name}, ${district})
    `;
  } catch (e) {
    if (isUniqueViolation(e)) return { fields: { phone: 'err.phoneTaken' }, values };
    throw e;
  }

  try {
    await signIn('credentials', { phone, password, redirectTo: '/me' });
  } catch (e) {
    if (e instanceof AuthError) return { error: 'err.generic', values };
    throw e;
  }
  return null;
}