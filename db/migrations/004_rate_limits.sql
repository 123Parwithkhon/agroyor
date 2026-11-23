CREATE TABLE rate_limits (
    id bigserial PRIMARY KEY,
    action text NOT NULL,
    key text NOT NULL, -- телефон + IP
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rate_limits_lookup_idx ON rate_limits (action, key, created_at);