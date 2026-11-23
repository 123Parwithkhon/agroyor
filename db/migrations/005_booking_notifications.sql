-- Флаг: арендатор уже видел изменение статуса своей брони
ALTER TABLE bookings
ADD COLUMN renter_seen boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS bookings_eq_status_005_idx ON bookings (equipment_id, status);