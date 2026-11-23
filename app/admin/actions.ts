'use server';

import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-guards';
import { hashPassword } from '@/lib/password';
import type { ResetState } from '@/lib/form-state';

const isId = (v: string) => /^\d{1,9}$/.test(v);

// Выдать или снять роль. Админ не может снять админку с себя.
export async function toggleRoleAction(formData: FormData): Promise<void> {
  const admin = await requireRole('admin', '/admin');
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!isId(userId) || (role !== 'reporter' && role !== 'admin')) return;
  if (userId === admin.id && role === 'admin') return;

  await db()`
    UPDATE users SET roles = CASE
      WHEN ${role} = ANY(roles) THEN array_remove(roles, ${role})
      ELSE array_append(roles, ${role})
    END
    WHERE id = ${userId}
  `;
  revalidatePath('/admin');
}

// Блокировка и разблокировка. Админ не может заблокировать себя.
export async function toggleBlockAction(formData: FormData): Promise<void> {
  const admin = await requireRole('admin', '/admin');
  const userId = String(formData.get('userId') ?? '');
  if (!isId(userId) || userId === admin.id) return;

  await db()`UPDATE users SET blocked = NOT blocked WHERE id = ${userId}`;
  revalidatePath('/admin');
}

// Алфавит без похожих символов (l, i, o, 0, 1), чтобы пароль легко диктовать
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function tempPassword(): string {
  let out = '';
  for (let i = 0; i < 8; i++) out += ALPHABET.charAt(randomInt(ALPHABET.length));
  return out;
}

// Сброс пароля другого пользователя. Пароль нигде не хранится в открытом виде.
// Вызывается через useActionState с привязанным userId; аргументы состояния формы не нужны.
export async function resetPasswordAction(userId: string): Promise<ResetState> {
  const admin = await requireRole('admin', '/admin');
  if (!isId(userId) || userId === admin.id) return { error: true };

  const temp = tempPassword();
  const hash = await hashPassword(temp);
  const rows = await db()`UPDATE users SET password_hash = ${hash} WHERE id = ${userId} RETURNING id`;
  if (rows.length === 0) return { error: true };
  return { password: temp };
}
