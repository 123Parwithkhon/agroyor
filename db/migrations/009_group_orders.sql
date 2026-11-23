-- «Совместный заказ» (складчина): соседи объединяют небольшие участки,
-- чтобы владельцу было выгодно выехать с крупной техникой (комбайн, дрон).

-- Объём заявки: гектары или часы (для техники с оплатой за гектар/час); для посуточной — пусто
ALTER TABLE bookings
  ADD COLUMN qty numeric(7, 2) CHECK (qty > 0 AND qty <= 1000),
  -- Сбор для соседей открыт и цель по площади (га), при которой выезд выгоден
  ADD COLUMN group_open boolean NOT NULL DEFAULT false,
  ADD COLUMN group_target_ha numeric(7, 2) CHECK (group_target_ha > 0 AND group_target_ha <= 1000),
  ADD CONSTRAINT bookings_group_needs_target CHECK (NOT group_open OR (group_target_ha IS NOT NULL AND qty IS NOT NULL));

CREATE TABLE booking_joins (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id integer NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id    integer NOT NULL REFERENCES users(id),
  area_ha    numeric(7, 2) NOT NULL CHECK (area_ha > 0 AND area_ha <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, user_id)
);
CREATE INDEX booking_joins_booking_idx ON booking_joins (booking_id);
CREATE INDEX bookings_group_open_idx ON bookings (equipment_id) WHERE group_open;
