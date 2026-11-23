'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guards';
import { formValues } from '@/lib/form-values';
import { equipmentSchema, fieldErrors, type EquipmentInput } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';
import { resolveWorks } from '@/lib/works';

const FIELDS = [
  'type', 'title', 'description', 'district', 'price', 'priceUnit',
  'workWidthM', 'fuelLPerH', 'powerHp', 'serviceRadiusKm',
] as const;

// Значения формы, чтобы вернуть их при ошибке (поля не очищаются)
function values(fd: FormData): Record<string, string> {
  return {
    ...formValues(fd, FIELDS),
    withOperator: fd.get('withOperator') === 'on' ? 'on' : '',
    works: fd.getAll('works').map(String).join(','),
  };
}

function parse(fd: FormData) {
  const s = (k: string) => String(fd.get(k) ?? '');
  return equipmentSchema.safeParse({
    type: s('type'),
    title: s('title'),
    description: s('description'),
    district: s('district'),
    price: s('price'),
    priceUnit: s('priceUnit'),
    withOperator: fd.get('withOperator') === 'on',
    photos: fd.getAll('photos').map(String).filter(Boolean),
    works: fd.getAll('works').map(String),
    workWidthM: s('workWidthM'),
    fuelLPerH: s('fuelLPerH'),
    powerHp: s('powerHp'),
    serviceRadiusKm: s('serviceRadiusKm'),
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

  const works = resolveWorks(d.works, d.type);
  const [row] = await db()<{ id: string }[]>`
    INSERT INTO equipment (owner_id, type, title, description, district, price, price_unit, with_operator, photos,
                           works, work_width_m, fuel_l_per_h, power_hp, service_radius_km)
    VALUES (${user.id}, ${d.type}, ${d.title}, ${d.description}, ${d.district}, ${d.price}, ${d.priceUnit},
            ${d.withOperator}, ${d.photos}, ${works}, ${d.workWidthM}, ${d.fuelLPerH}, ${d.powerHp},
            ${d.serviceRadiusKm})
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
      with_operator = ${d.withOperator}, photos = ${d.photos}, works = ${resolveWorks(d.works, d.type)},
      work_width_m = ${d.workWidthM}, fuel_l_per_h = ${d.fuelLPerH}, power_hp = ${d.powerHp},
      service_radius_km = ${d.serviceRadiusKm}
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
