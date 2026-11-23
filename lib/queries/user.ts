import 'server-only';
import { db } from '@/lib/db';

export async function getUserDistrict(id: string): Promise<string | null> {
  const [r] = await db()<{ district: string | null }[]>`SELECT district FROM users WHERE id = ${id}`;
  return r?.district ?? null;
}