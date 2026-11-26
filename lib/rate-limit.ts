import 'server-only';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

// Лимит: 10 попыток за 10 минут на связку телефон + IP
const WINDOW_MINUTES = 10;
const MAX_ATTEMPTS = 10;

export type RateLimitAction = 'login' | 'login_api' | 'register' | 'booking' | 'demand' | 'trip';

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

// Возвращает false, если лимит исчерпан; иначе записывает попытку
export async function hitRateLimit(
  action: RateLimitAction,
  phone: string,
): Promise<boolean> {
  const sql = db();
  const key = `${phone}|${await clientIp()}`;

  const [row] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM rate_limits
    WHERE action = ${action} AND key = ${key}
      AND created_at > now() - make_interval(mins => ${WINDOW_MINUTES}::int)
  `;
  if ((row?.n ?? 0) >= MAX_ATTEMPTS) return false;

  await sql`INSERT INTO rate_limits (action, key) VALUES (${action}, ${key})`;

  // Изредка чистим старые записи, чтобы таблица не росла
  if (Math.random() < 0.02) {
    await sql`DELETE FROM rate_limits WHERE created_at < now() - interval '1 day'`;
  }
  return true;
}