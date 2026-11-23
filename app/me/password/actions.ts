'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guards';
import { hashPassword, verifyPassword } from '@/lib/password';
import { hitRateLimit } from '@/lib/rate-limit';
import { changePasswordSchema, fieldErrors } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser('/me/password');
  const parsed = changePasswordSchema.safeParse({
    current: String(formData.get('current') ?? ''),
    next: String(formData.get('next') ?? ''),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  if (!(await hitRateLimit('login', user.id))) return { error: 'err.rateLimited' };

  const sql = db();
  const [u] = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${user.id}
  `;
  if (!u || !(await verifyPassword(parsed.data.current, u.password_hash))) {
    return { fields: { current: 'err.badPassword' } };
  }

  const hash = await hashPassword(parsed.data.next);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;
  redirect('/me?notice=pwchanged');
}