-- Виды работ (поиск по задаче), характеристики техники и радиус выезда (для карты)
ALTER TABLE equipment
  ADD COLUMN works text[] NOT NULL DEFAULT '{}'
    CHECK (works <@ ARRAY['plowing', 'sowing', 'spraying', 'harvesting', 'irrigation', 'transport']),
  ADD COLUMN work_width_m numeric(5, 2) CHECK (work_width_m > 0 AND work_width_m < 100),
  ADD COLUMN fuel_l_per_h numeric(5, 1) CHECK (fuel_l_per_h > 0 AND fuel_l_per_h < 500),
  ADD COLUMN power_hp integer CHECK (power_hp > 0 AND power_hp < 2000),
  ADD COLUMN service_radius_km integer CHECK (service_radius_km > 0 AND service_radius_km <= 300);

CREATE INDEX equipment_works_idx ON equipment USING gin (works);

-- Существующим объявлениям — работы по виду техники (та же таблица, что DEFAULT_WORKS в lib/works.ts)
UPDATE equipment SET works = CASE type
  WHEN 'tractor' THEN ARRAY['plowing', 'sowing', 'transport']
  WHEN 'cultivator' THEN ARRAY['plowing']
  WHEN 'seeder' THEN ARRAY['sowing']
  WHEN 'sprayer' THEN ARRAY['spraying']
  WHEN 'harvester' THEN ARRAY['harvesting']
  WHEN 'motoblock' THEN ARRAY['plowing']
  WHEN 'drone' THEN ARRAY['spraying']
  WHEN 'trailer' THEN ARRAY['transport']
  ELSE ARRAY[]::text[]
END
WHERE works = '{}';
