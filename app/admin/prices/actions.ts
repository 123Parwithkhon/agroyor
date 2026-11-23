'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-guards';
import { marketSchema, productSchema } from '@/lib/validation';

const raw = (fd: FormData) => ({
  nameTj: String(fd.get('nameTj') ?? ''),
  nameRu: String(fd.get('nameRu') ?? ''),
  nameEn: String(fd.get('nameEn') ?? ''),
  sortOrder: String(fd.get('sortOrder') || '0'),
  isActive: fd.get('isActive') === 'on',
});

// id существующей записи или null — новая запись; 'bad' — подделанное значение
function idOf(fd: FormData): string | null | 'bad' {
  const id = String(fd.get('id') ?? '');
  if (id === '') return null;
  return /^\d{1,9}$/.test(id) ? id : 'bad';
}

function done(): never {
  revalidatePath('/admin/prices');
  revalidatePath('/prices', 'layout');
  revalidatePath('/reporter');
  revalidatePath('/');
  redirect('/admin/prices?saved=1');
}

export async function saveMarketAction(formData: FormData): Promise<void> {
  await requireRole('admin', '/admin/prices');
  const id = idOf(formData);
  const parsed = marketSchema.safeParse(raw(formData));
  if (!parsed.success || id === 'bad') redirect('/admin/prices?error=1');
  const d = parsed.data;

  const sql = db();
  if (id) {
    await sql`
      UPDATE markets SET name_tj = ${d.nameTj}, name_ru = ${d.nameRu}, name_en = ${d.nameEn},
        sort_order = ${d.sortOrder}, active = ${d.isActive}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO markets (name_tj, name_ru, name_en, sort_order, active)
      VALUES (${d.nameTj}, ${d.nameRu}, ${d.nameEn}, ${d.sortOrder}, ${d.isActive})
    `;
  }
  done();
}

export async function saveProductAction(formData: FormData): Promise<void> {
  await requireRole('admin', '/admin/prices');
  const id = idOf(formData);
  const parsed = productSchema.safeParse({ ...raw(formData), unit: String(formData.get('unit') ?? '') });
  if (!parsed.success || id === 'bad') redirect('/admin/prices?error=1');
  const d = parsed.data;

  const sql = db();
  if (id) {
    await sql`
      UPDATE products SET name_tj = ${d.nameTj}, name_ru = ${d.nameRu}, name_en = ${d.nameEn},
        unit = ${d.unit}, sort_order = ${d.sortOrder}, active = ${d.isActive}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO products (name_tj, name_ru, name_en, unit, sort_order, active)
      VALUES (${d.nameTj}, ${d.nameRu}, ${d.nameEn}, ${d.unit}, ${d.sortOrder}, ${d.isActive})
    `;
  }
  done();
}
