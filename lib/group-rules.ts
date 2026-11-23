// «Совместный заказ» (складчина на технику): чистые правила, проверяются тестами.
// Каждый участник платит за свою площадь (цена за гектар × га), поэтому деление стоимости честное.
import { rentalCost } from '@/lib/booking-rules';

export type GroupProgress = {
  /** Собрано гектаров: площадь организатора + соседей */
  collected: number;
  target: number;
  /** Осталось собрать до цели (0 — цель достигнута) */
  left: number;
  /** 0–100 для полосы прогресса */
  percent: number;
  reached: boolean;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export function groupProgress(ownQty: number, joined: number[], target: number): GroupProgress {
  const collected = r2(ownQty + joined.reduce((s, a) => s + a, 0));
  const left = r2(Math.max(0, target - collected));
  return {
    collected,
    target,
    left,
    percent: target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0,
    reached: collected >= target,
  };
}

/** Доля участника: его гектары × цена за гектар. */
export function shareCost(areaHa: number, pricePerHa: number): number {
  return rentalCost(areaHa, pricePerHa);
}

/** Площадь соседа: 0,1–100 га, запятая или точка, до двух знаков. */
export function parseArea(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 0.1 && n <= 100 ? n : null;
}

/** Проверка заявки организатора. Возвращает ключ ошибки словаря или null. */
export function checkGroupRequest(o: {
  unit: 'day' | 'hour' | 'hectare';
  open: boolean;
  qty: number | null;
  target: number | null;
}): string | null {
  if (!o.open) return null;
  if (o.unit !== 'hectare') return 'err.groupHectareOnly';
  if (o.qty === null) return 'err.qtyInvalid';
  if (o.target === null || o.target <= o.qty || o.target > 1000) return 'err.groupTarget';
  return null;
}

/** Можно ли соседу присоединиться к сбору. Возвращает ключ ошибки или null. */
export function checkJoin(o: {
  groupOpen: boolean;
  status: string;
  endDate: string;
  today: string;
  userId: string;
  renterId: string;
  ownerId: string;
  alreadyJoined: boolean;
}): string | null {
  if (!o.groupOpen || !['pending', 'confirmed'].includes(o.status) || o.endDate < o.today) return 'err.groupClosed';
  if (o.userId === o.ownerId) return 'err.ownEquipment';
  if (o.userId === o.renterId || o.alreadyJoined) return 'err.groupAlready';
  return null;
}
