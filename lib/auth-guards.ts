import 'server-only';
import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export { safeNext } from '@/lib/safe-next';

// id в приложении — строка (в БД integer): так их можно сравнивать с данными форм и адресов
export type CurrentUser = { id: string; name: string; roles: string[] };
export type Role = 'reporter' | 'admin';

type Row = { id: string; name: string; roles: string[]; blocked: boolean };

// Текущий пользователь по свежим данным из БД; null — не вошёл или заблокирован
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !/^\d{1,9}$/.test(id)) return null;
  const [u] = await db()<Row[]>`SELECT id::text AS id, name, roles, blocked FROM users WHERE id = ${id}`;
  if (!u || u.blocked) return null;
  return { id: u.id, name: u.name, roles: u.roles };
});

export async function requireUser(next = '/me'): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireRole(role: Role, next: string): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (!user.roles.includes(role)) notFound();
  return user;
}
