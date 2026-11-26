-- «Сигнал дефицита» (обратный аукцион): фермер не нашёл свободную технику и «кидает клич»
-- владельцам техники нужного вида в радиусе ~30 км. Владельцы откликаются в один клик своей техникой.
CREATE TABLE demand_requests (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users(id),
  type        equipment_type NOT NULL,
  district    text NOT NULL,
  need_date   date NOT NULL,
  area_ha     numeric(7, 2) NOT NULL CHECK (area_ha > 0 AND area_ha <= 1000),
  -- Бюджет, сомони за гектар (необязательно)
  budget_per_ha numeric(10, 2) CHECK (budget_per_ha > 0 AND budget_per_ha < 100000),
  note        text NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  closed      boolean NOT NULL DEFAULT false,
  -- Автор видел все отклики, пришедшие до этого момента (для бейджа)
  author_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX demand_requests_open_idx ON demand_requests (need_date) WHERE NOT closed;
CREATE INDEX demand_requests_user_idx ON demand_requests (user_id);

CREATE TABLE demand_responses (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id   integer NOT NULL REFERENCES demand_requests(id) ON DELETE CASCADE,
  owner_id     integer NOT NULL REFERENCES users(id),
  equipment_id integer NOT NULL REFERENCES equipment(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, equipment_id)
);
CREATE INDEX demand_responses_request_idx ON demand_responses (request_id);

-- Владелец видел запросы «рядом», созданные до этого момента (для бейджа)
ALTER TABLE users ADD COLUMN requests_seen_at timestamptz NOT NULL DEFAULT now();

-- «Цифровой маршрут урожая»: рейс поле → рынок. Фермеры, которые в один день везут
-- на один рынок с близких полей, видят друг друга и делят стоимость рейса.
CREATE TABLE trips (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users(id),
  product_id  integer NOT NULL REFERENCES products(id),
  tons        numeric(6, 2) NOT NULL CHECK (tons > 0 AND tons <= 40),
  from_district text NOT NULL,
  market_id   integer NOT NULL REFERENCES markets(id),
  trip_date   date NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_date, market_id)
);
CREATE INDEX trips_date_market_idx ON trips (trip_date, market_id);
