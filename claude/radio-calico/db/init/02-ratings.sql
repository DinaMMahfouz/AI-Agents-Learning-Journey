-- RadioCalico — song rating schema.
-- Thumbs up / down per song, one vote per listener — no login required.
--
-- A "song" has no stable id in the stream metadata, so the application
-- derives song_id = sha1( lower(trim(artist)) || '\n' || lower(trim(title)) ).
--
-- A "listener" is identified by a server-side fingerprint (voter_fp): a hash
-- of the client IP (from nginx's X-Real-IP) plus the User-Agent. No account,
-- no cookie the user can clear to vote again.

CREATE TABLE IF NOT EXISTS song_ratings (
    song_id     TEXT        NOT NULL,
    voter_fp    TEXT        NOT NULL,                              -- sha256(ip|user-agent)
    rating      SMALLINT    NOT NULL CHECK (rating IN (-1, 1)),    -- -1 down, +1 up
    artist      TEXT        NOT NULL DEFAULT '',                   -- kept for readability
    title       TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- One row per (song, fingerprint) => a listener can never rate a song twice.
    PRIMARY KEY (song_id, voter_fp)
);

CREATE INDEX IF NOT EXISTS song_ratings_song_idx ON song_ratings (song_id);

-- Convenience view: running thumbs up / down totals per song.
CREATE OR REPLACE VIEW song_rating_totals AS
SELECT
    song_id,
    COUNT(*) FILTER (WHERE rating =  1) AS up,
    COUNT(*) FILTER (WHERE rating = -1) AS down
FROM song_ratings
GROUP BY song_id;
