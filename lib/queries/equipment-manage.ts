import 'server-only';
import { db } from '@/lib/db';
import type { EquipmentType, PriceUnit } from '@/lib/equipment';

export type MyEquipment = {
  id: string;
  type: EquipmentType;
  title: string;
  description: string;
  district: string;
  price: number;
  price_unit: PriceUnit;
  with_operator: boolean;
  photos: string[];
  active: boolean;
  hidden_by_admin: boolean;
};

const COLS = `id::text AS id, type, title, description, district, price, price_unit,
  with_operator, photos, active, hidden_by_admin`;

export async function getMyEquipment(userId: string): Promise<MyEquipment[]> {
  const sql = db();
  return sql<MyEquipment[]>`
    SELECT ${sql.unsafe(COLS)} FROM equipment
    WHERE owner_id = ${userId} ORDER BY created_at DESC
  `;
}

export async function getMyEquipmentById(id: string, userId: string): Promise<MyEquipment | null> {
  // Неверный формат id в адресе — считаем, что объявления нет
  if (!/^\d{1,9}$/.test(id)) return null;
  const sql = db();
  const [row] = await sql<MyEquipment[]>`
    SELECT ${sql.unsafe(COLS)} FROM equipment
    WHERE id = ${id} AND owner_id = ${userId}
  `;
  return row ?? null;
}
