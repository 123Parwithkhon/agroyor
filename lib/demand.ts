// «Сигнал дефицита»: правила запроса фермера и отклика владельца. Чистый модуль (без БД) — для тестов.
import { z } from 'zod';
import { DISTRICTS } from '@/lib/districts';
import { EQUIPMENT_TYPES } from '@/lib/equipment';
import { daysInclusive } from '@/lib/booking-rules';
import { districtDistanceKm } from '@/lib/geo';

/** Запрос видят владельцы техники этого вида, если техника не дальше этого (или их радиуса выезда). */
export const DEMAND_RADIUS_KM = 30;
/** На сколько дней вперёд можно искать технику. */
export const DEMAND_MAX_DAYS_AHEAD = 90;

const districtCodes = new Set<string>(DISTRICTS.map((d) => d.code));

function optionalMoney() {
  return z
    .string()
    .optional()
    .transform((value, ctx): number | null => {
      const s = (value ?? '').trim().replace(/\s/g, '').replace(',', '.');
      if (s === '') return null;
      const n = Number(s);
      if (!/^\d+(\.\d{1,2})?$/.test(s) || !(n > 0 && n < 100_000)) {
        ctx.addIssue({ code: 'custom', message: 'err.budgetInvalid' });
        return z.NEVER;
      }
      return n;
    });
}

export const demandSchema = z.object({
  type: z.enum(EQUIPMENT_TYPES, 'err.kindInvalid'),
  district: z.string().refine((v) => districtCodes.has(v), 'err.districtInvalid'),
  needDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'err.dateInvalid'),
  area: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const s = v.replace(',', '.');
      const n = Number(s);
      if (!/^\d+(\.\d{1,2})?$/.test(s) || !(n >= 0.1 && n <= 100)) {
        ctx.addIssue({ code: 'custom', message: 'err.areaInvalid' });
        return z.NEVER;
      }
      return n;
    }),
  budget: optionalMoney(),
  note: z.string().trim().max(500, 'err.noteLong').optional().transform((v) => v ?? ''),
});

export type DemandInput = z.infer<typeof demandSchema>;

/** Дата нужна не раньше сегодня и не дальше 90 дней; иначе ключ ошибки. */
export function checkNeedDate(needDate: string, today: string): string | null {
  const span = daysInclusive(today, needDate);
  if (span === null) return 'err.dateInvalid';
  if (span < 1) return 'err.datePast';
  if (span > DEMAND_MAX_DAYS_AHEAD + 1) return 'err.dateTooFar';
  return null;
}

/** Видит ли владелец запрос: тот же вид техники и поле в пределах 30 км (или радиуса выезда, если он больше). */
export function isNearRequest(
  eq: { type: string; district: string; service_radius_km: number | null },
  req: { type: string; district: string },
): boolean {
  if (eq.type !== req.type) return false;
  const km = districtDistanceKm(eq.district, req.district);
  if (km === null) return false;
  return km <= Math.max(DEMAND_RADIUS_KM, eq.service_radius_km ?? 0);
}

/** Можно ли откликнуться: запрос открыт, дата не прошла, не свой, техника подходит, ещё не откликался ею. */
export function checkResponse(p: {
  closed: boolean;
  needDate: string;
  today: string;
  authorId: string;
  userId: string;
  near: boolean;
  alreadyResponded: boolean;
}): string | null {
  if (p.closed || p.needDate < p.today) return 'err.requestClosed';
  if (p.authorId === p.userId) return 'err.ownRequest';
  if (!p.near) return 'err.notNear';
  if (p.alreadyResponded) return 'err.alreadyResponded';
  return null;
}
