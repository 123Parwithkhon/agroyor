ALTER TABLE equipment ADD COLUMN IF NOT EXISTS works text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS equipment_works_idx ON equipment USING gin (works);

-- Заполнить виды работ у существующих объявлений по виду техники.
-- Коды видов ('tractor' и т. д.) замените на ваши из lib/equipment.ts
UPDATE equipment SET works = CASE kind::text
  WHEN 'tractor'  THEN ARRAY['plowing','sowing','transport']
  WHEN 'combine'  THEN ARRAY['harvesting']
  WHEN 'sprayer'  THEN ARRAY['spraying']
  WHEN 'drone'    THEN ARRAY['spraying']
  WHEN 'trailer'  THEN ARRAY['transport']
  ELSE works END
WHERE works = '{}';