-- Английские названия продуктов (третий язык интерфейса).
-- Пустая строка = перевода нет, интерфейс покажет русское название.
ALTER TABLE products ADD COLUMN name_en text NOT NULL DEFAULT '';

-- Переводы для продуктов из начального сида
UPDATE products SET name_en = v.en
FROM (VALUES
  ('Лук', 'Onion'),
  ('Картофель', 'Potato'),
  ('Морковь', 'Carrot'),
  ('Помидор', 'Tomato'),
  ('Яблоки', 'Apples'),
  ('Курага', 'Dried apricots'),
  ('Мука', 'Flour'),
  ('Говядина', 'Beef')
) AS v(ru, en)
WHERE products.name_ru = v.ru AND products.name_en = '';
