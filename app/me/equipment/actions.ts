'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guards';
import { formValues } from '@/lib/form-values';
import { equipmentSchema, fieldErrors, type EquipmentInput } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';

const FIELDS = ['type', 'title', 'description', 'district', 'price', 'priceUnit'] as const;

// Значения формы, чтобы вернуть их при ошибке (поля не очищаются)
function values(fd: FormData): Record<string, string> {
  return {
    ...formValues(fd, FIELDS),
    withOperator: fd.get('withOperator') === 'on' ? 'on' : '',
  };
}

function parse(fd: FormData) {
  return equipmentSchema.safeParse({
    type: String(fd.get('type') ?? ''),
    title: String(fd.get('title') ?? ''),
    description: String(fd.get('description') ?? ''),
    district: String(fd.get('district') ?? ''),
    price: String(fd.get('price') ?? ''),
    priceUnit: String(fd.get('priceUnit') ?? ''),
    withOperator: fd.get('withOperator') === 'on',
    photos: fd.getAll('photos').map(String).filter(Boolean),
  });
}

function revalidateCatalog(id?: string): void {
  revalidatePath('/me/equipment');
  revalidatePath('/equipment');
  revalidatePath('/');
  if (id) revalidatePath(`/equipment/${id}`);
}

// owner_id — только из сессии, никогда из формы
export async function createEquipmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser('/me/equipment/new');
  const parsed = parse(formData);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values: values(formData) };
  const d: EquipmentInput = parsed.data;

  const [row] = await db()<{ id: string }[]>`
    INSERT INTO equipment (owner_id, type, title, description, district, price, price_unit, with_operator, photos)
    VALUES (${user.id}, ${d.type}, ${d.title}, ${d.description}, ${d.district}, ${d.price}, ${d.priceUnit},
            ${d.withOperator}, ${d.photos})
    RETURNING id::text AS id
  `;
  revalidateCatalog(row?.id);
  redirect('/me/equipment');
}

export async function updateEquipmentAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(`/me/equipment/${id}/edit`);
  if (!/^\d{1,9}$/.test(id)) return { error: 'err.unavailable' };
  const parsed = parse(formData);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values: values(formData) };
  const d: EquipmentInput = parsed.data;

  const rows = await db()`
    UPDATE equipment SET type = ${d.type}, title = ${d.title}, description = ${d.description},
      district = ${d.district}, price = ${d.price}, price_unit = ${d.priceUnit},
      with_operator = ${d.withOperator}, photos = ${d.photos}
    WHERE id = ${id} AND owner_id = ${user.id}
    RETURNING id
  `;
  if (rows.length === 0) return { error: 'err.unavailable', values: values(formData) };
  revalidateCatalog(id);
  redirect('/me/equipment');
}

// Включить или выключить своё объявление
export async function toggleActiveAction(formData: FormData): Promise<void> {
  const user = await requireUser('/me/equipment');
  const id = String(formData.get('id') ?? '');
  if (!/^\d{1,9}$/.test(id)) return;
  await db()`UPDATE equipment SET active = NOT active WHERE id = ${id} AND owner_id = ${user.id}`;
  revalidateCatalog(id);
}
