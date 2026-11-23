-- Начальная схема AgroYor
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE equipment_type AS ENUM
  ('tractor', 'cultivator', 'seeder', 'sprayer', 'harvester', 'motoblock', 'drone', 'trailer', 'other');
CREATE TYPE price_unit AS ENUM ('hour', 'day', 'hectare');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled', 'done');
CREATE TYPE product_unit AS ENUM ('kg', 'piece', 'litre');

CREATE TABLE users (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone         text NOT NULL UNIQUE CHECK (phone ~ '^\+992[0-9]{9}$'),
  name          text NOT NULL,
  password_hash text NOT NULL,
  district      text NOT NULL,
  roles         text[] NOT NULL DEFAULT ARRAY['user']
                CHECK (roles <@ ARRAY['user', 'reporter', 'admin']),
  blocked       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE equipment (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id        integer NOT NULL REFERENCES users(id),
  type            equipment_type NOT NULL,
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  district        text NOT NULL,
  price           numeric(10, 2) NOT NULL CHECK (price > 0),
  price_unit      price_unit NOT NULL,
  with_operator   boolean NOT NULL DEFAULT false,
  photos          text[] NOT NULL DEFAULT '{}' CHECK (cardinality(photos) <= 5),
  active          boolean NOT NULL DEFAULT true,
  hidden_by_admin boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX equipment_owner_idx ON equipment (owner_id);
CREATE INDEX equipment_catalog_idx ON equipment (type, district) WHERE active AND NOT hidden_by_admin;

CREATE TABLE bookings (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  equipment_id integer NOT NULL REFERENCES equipment(id),
  renter_id    integer NOT NULL REFERENCES users(id),
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  status       booking_status NOT NULL DEFAULT 'pending',
  note         text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  decided_at   timestamptz,
  -- не больше 30 дней в одной брони (даты включительно)
  CHECK (end_date >= start_date AND end_date - start_date <= 29),
  -- подтверждённые брони одной техники не пересекаются (страховка поверх транзакционной проверки)
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    equipment_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status = 'confirmed')
);
CREATE INDEX bookings_equipment_idx ON bookings (equipment_id, status);
CREATE INDEX bookings_renter_idx ON bookings (renter_id);

CREATE TABLE reviews (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id     integer NOT NULL REFERENCES bookings(id),
  author_id      integer NOT NULL REFERENCES users(id),
  target_user_id integer NOT NULL REFERENCES users(id),
  rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text           text NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, author_id),
  CHECK (author_id <> target_user_id)
);
CREATE INDEX reviews_target_idx ON reviews (target_user_id);

CREATE TABLE markets (
  id     integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city   text NOT NULL,
  name   text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE products (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name_tj    text NOT NULL,
  name_ru    text NOT NULL,
  unit       product_unit NOT NULL DEFAULT 'kg',
  sort_order integer NOT NULL DEFAULT 0,
  active     boolean NOT NULL DEFAULT true
);

CREATE TABLE prices (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market_id   integer NOT NULL REFERENCES markets(id),
  product_id  integer NOT NULL REFERENCES products(id),
  date        date NOT NULL,
  price       numeric(10, 2) NOT NULL CHECK (price > 0 AND price < 100000),
  reporter_id integer NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_id, product_id, date)
);
CREATE INDEX prices_date_idx ON prices (date);
CREATE INDEX prices_product_date_idx ON prices (product_id, date);
