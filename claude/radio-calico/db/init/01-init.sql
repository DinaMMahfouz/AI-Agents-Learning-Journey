-- RadioCalico — initial schema bootstrap.
-- Files in db/init/ run automatically the FIRST time the postgres
-- container initializes its data volume (alphabetical order).
-- To re-run after editing, recreate the volume: `make db-reset`.

-- A tiny sanity table so you can confirm the DB is wired up end to end.
CREATE TABLE IF NOT EXISTS healthcheck (
    id          SERIAL PRIMARY KEY,
    checked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    note        TEXT
);

INSERT INTO healthcheck (note) VALUES ('database initialized');
