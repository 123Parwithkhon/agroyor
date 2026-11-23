'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-guards';

export async function toggleHiddenAction(formData: FormData): Promise<void> {
  await requireRole('admin', '/admin/equipment');
  const id = String(formData.get('id') ?? '');
  if (!/^\d{1,9}$/.test(id)) return;
  await db()`UPDATE equipment SET hidden_by_admin = NOT hidden_by_admin WHERE id = ${id}`;
  revalidatePath('/admin/equipment');
  revalidatePath('/equipment');
  revalidatePath('/');
  revalidatePath(`/equipment/${id}`);
}
