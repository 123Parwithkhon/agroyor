// Виды техники и единицы цены — общие для сервера и клиента.
import type { DictKey } from '@/lib/i18n';

export const EQUIPMENT_TYPES = [
  'tractor',
  'cultivator',
  'seeder',
  'sprayer',
  'harvester',
  'motoblock',
  'drone',
  'trailer',
  'other',
] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const PRICE_UNITS = ['hour', 'day', 'hectare'] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export const PRODUCT_UNITS = ['kg', 'piece', 'litre'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export function typeKey(type: EquipmentType): DictKey {
  return `eqType.${type}`;
}

export function priceUnitKey(unit: PriceUnit): DictKey {
  return `priceUnit.${unit}`;
}

export function productUnitKey(unit: ProductUnit): DictKey {
  return `unit.${unit}`;
}
