import { z } from 'zod';
import { normalizePhone } from '@/lib/phone';
import { DISTRICTS } from '@/lib/districts';
import { EQUIPMENT_TYPES, PRICE_UNITS, PRODUCT_UNITS } from '@/lib/equipment';
import { isWork, WORKS } from '@/lib/works';

// Сообщения — ключи словаря i18n, а не готовый текст
const phone = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const p = normalizePhone(v);
    if (!p) {
      ctx.addIssue({ code: 'custom', message: 'err.phoneInvalid' });
      return z.NEVER;
    }
    return p;
  });

const districtCodes = new Set<string>(DISTRICTS.map((d) => d.code));

export const loginSchema = z.object({
  phone,
  password: z.string().min(1, 'err.passwordRequired').max(200, 'err.generic'),
});

export const registerSchema = z.object({
  phone,
  password: z.string().min(8, 'err.passwordShort').max(200, 'err.generic'),
  name: z.string().trim().min(2, 'err.nameShort').max(80, 'err.nameShort'),
  district: z.string().refine((v) => districtCodes.has(v), 'err.districtInvalid'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Первая ошибка по каждому полю: { phone: 'err.phoneInvalid', ... }
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

// Фото: только Vercel Blob или локальная папка /uploads (без токена Blob, только в разработке)
function isPhotoUrl(v: string): boolean {
  if (/^\/uploads\/[\w-]+\.(jpg|png|webp)$/.test(v)) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

/**
 * Необязательное число из формы: пустая строка → null; запятая как десятичный разделитель.
 * Границы как в CHECK миграции 008: строго больше min, не больше max (целое — если integer).
 */
function optionalNumber(min: number, max: number, integer = false) {
  const pattern = integer ? /^\d+$/ : /^\d+(\.\d{1,2})?$/;
  return z
    .string()
    .optional()
    .transform((value, ctx): number | null => {
      const raw = (value ?? '').trim();
      if (raw === '') return null;
      const s = raw.replace(',', '.');
      const n = Number(s);
      if (!pattern.test(s) || !(n > min && n <= max)) {
        ctx.addIssue({ code: 'custom', message: 'err.specInvalid' });
        return z.NEVER;
      }
      return n;
    });
}

export const equipmentSchema = z.object({
  type: z.enum(EQUIPMENT_TYPES, 'err.kindInvalid'),
  title: z.string().trim().min(3, 'err.titleShort').max(100, 'err.titleShort'),
  description: z.string().trim().max(2000, 'err.generic'),
  district: z.string().refine((v) => districtCodes.has(v), 'err.districtInvalid'),
  // Пустая строка — ошибка, а не 0; копейки — не больше двух знаков (numeric(10,2) в БД)
  price: z
    .string()
    .trim()
    .transform((v) => v.replace(',', '.'))
    .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/, 'err.priceInvalid'))
    .transform(Number)
    .pipe(z.number().gt(0, 'err.priceInvalid').lt(100000, 'err.priceInvalid')),
  priceUnit: z.enum(PRICE_UNITS, 'err.unitInvalid'),
  withOperator: z.boolean(),
  photos: z
    .array(z.string())
    .max(5, 'err.photoInvalid')
    .refine((a) => a.every(isPhotoUrl), 'err.photoInvalid'),
  // Неизвестные коды работ отбрасываются; пустой список дополняется по виду техники (resolveWorks)
  works: z.array(z.string()).max(WORKS.length).default([]).transform((a) => a.filter(isWork)),
  workWidthM: optionalNumber(0, 100),
  fuelLPerH: optionalNumber(0, 500),
  powerHp: optionalNumber(0, 2000, true),
  serviceRadiusKm: optionalNumber(0, 300, true),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;

export const bookingSchema = z.object({
  startDate: z.string().trim(),
  endDate: z.string().trim(),
  comment: z.string().trim().max(500, 'err.generic'),
});

export const reviewSchema = z.object({
  bookingId: z.string().regex(/^\d{1,9}$/, 'err.generic'),
  rating: z.coerce.number().int().min(1, 'err.ratingInvalid').max(5, 'err.ratingInvalid'),
  comment: z.string().trim().max(500, 'err.generic'),
});

const catalogName = z.string().trim().min(1, 'err.generic').max(80, 'err.generic');

export const marketSchema = z.object({
  nameTj: catalogName,
  nameRu: catalogName,
  // Английское название можно не заполнять: тогда показывается русское
  nameEn: z.string().trim().max(80, 'err.generic'),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

export const productSchema = marketSchema.extend({
  unit: z.enum(PRODUCT_UNITS, 'err.generic'),
});

export const changePasswordSchema = z.object({
  current: z.string().min(1, 'err.passwordRequired').max(200, 'err.generic'),
  next: z.string().min(8, 'err.passwordShort').max(200, 'err.generic'),
});
