import 'server-only';
import { db } from '@/lib/db';

export type LandingStats = { equipment: number; markets: number; products: number };

// Цифры для главной: те же условия, что и в каталоге / таблице цен
export async function getLandingStats(): Promise<LandingStats> {
  const [row] = await db()<LandingStats[]>`
    SELECT
      (SELECT count(*) FROM equipment e JOIN users u ON u.id = e.owner_id
        WHERE e.active AND NOT e.hidden_by_admin AND NOT u.blocked)::int AS equipment,
      (SELECT count(*) FROM markets WHERE active)::int AS markets,
      (SELECT count(*) FROM products WHERE active)::int AS products
  `;
  return row ?? { equipment: 0, markets: 0, products: 0 };
}
