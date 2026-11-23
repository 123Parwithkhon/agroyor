-- Названия рынков на трёх языках: их правит админ в /admin/prices, показывают таблицы цен и CSV.
-- Раньше у рынка были только город (city) и общее название (name) — переносим город в name_*.
ALTER TABLE markets
  ADD COLUMN name_tj text NOT NULL DEFAULT '',
  ADD COLUMN name_ru text NOT NULL DEFAULT '',
  ADD COLUMN name_en text NOT NULL DEFAULT '';

UPDATE markets SET
  name_tj = city,
  name_ru = CASE city
    WHEN 'Хуҷанд' THEN 'Худжанд'
    WHEN 'Истаравшан' THEN 'Истаравшан'
    WHEN 'Исфара' THEN 'Исфара'
    ELSE city END,
  name_en = CASE city
    WHEN 'Хуҷанд' THEN 'Khujand'
    WHEN 'Истаравшан' THEN 'Istaravshan'
    WHEN 'Исфара' THEN 'Isfara'
    ELSE '' END;

ALTER TABLE markets DROP COLUMN city, DROP COLUMN name;

-- Порядок рынков: у существующих — по id
UPDATE markets SET sort_order = id WHERE sort_order = 0;

-- Миграция 006 добавила is_active, дублирующий active из 001. Оставляем active (его использует весь код),
-- значение берём из is_active — его мог менять админ.
UPDATE markets SET active = is_active;
UPDATE products SET active = is_active;
ALTER TABLE markets DROP COLUMN is_active;
ALTER TABLE products DROP COLUMN is_active;
