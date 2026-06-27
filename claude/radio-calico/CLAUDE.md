# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RadioCalico is a local prototyping stack for a lossless-radio website. Three
**rootless Podman** containers on a shared `radiocalico-net` network:

| Container          | Image                | Role                                          |
|--------------------|----------------------|-----------------------------------------------|
| `radiocalico-web`  | nginx:1.27-alpine    | Serves the static site + reverse-proxies `/api/` |
| `radiocalico-app`  | built from `app/`    | Node ratings API on :3000 (no framework, stdlib `http`) |
| `radiocalico-db`   | postgres:16-alpine   | Database; init SQL in `db/init/` runs on first boot |

Browser → nginx (`:8080`) → static files **or** `/api/` → `radiocalico-app:3000` → Postgres.
Nginx resolves the app container by name via podman network DNS.

## Commands

The **Makefile is the primary workflow** (plain `podman` commands, no compose tooling installed).

```sh
make up        # build app image + start all three containers
make down      # stop & remove containers (DB volume preserved)
make restart   # down + up (rebuilds app image, recreates containers)
make status    # podman ps for the radiocalico-* containers
make app       # rebuild ONLY the backend image (radiocalico-app:latest)
make logs-app  # tail backend logs (also logs-web, logs-db, logs)
make psql      # psql shell into the database
make db-reset  # DESTROY the DB volume and re-run db/init/*.sql
make clean     # remove containers + volume + network
```

There is no build step, linter, or test suite. Verify changes by hand:

```sh
curl localhost:8080/api/health                      # {"status":"ok"}
curl 'localhost:8080/api/ratings?artist=X&title=Y'  # {"up":0,"down":0,"yourRating":0}
```

### Gotchas when iterating

- **Backend code changes don't auto-apply.** `make up` only creates containers
  that don't already exist. After editing `app/server.js`, run `make restart`
  (rebuilds the image and recreates the container) — a bare `make up` is a no-op
  on a running container.
- **DB schema changes don't auto-apply.** `db/init/*.sql` runs *only* on first
  initialization of the volume. To pick up edits to those files, `make db-reset`
  (this wipes all data).
- **`compose.yaml` is NOT kept in sync with the Makefile** — it predates the
  backend and only defines `db` + `web` (no `app` service), so `/api/` won't
  work under compose. Treat the Makefile as source of truth.
- Volume mounts use the `:Z` SELinux relabel flag (host is SELinux-enforcing).

## Ratings architecture (the non-obvious part)

The thumbs up/down feature has **no login and no client-side identity**. Two
derived identifiers, defined consistently across `app/server.js`,
`db/init/02-ratings.sql`, and `web/html/index.html`, make it work:

- **`song_id`** = `sha1( lower(trim(artist)) + "\n" + lower(trim(title)) )`.
  The stream has no stable track id, so the song is identified by its
  normalized artist+title hash.
- **`voter_fp`** = `sha256( ip + "|" + user-agent )`. The listener is fingerprinted
  server-side from nginx's `X-Real-IP` (forwarded in `web/nginx.conf`) + UA. The
  raw IP is never stored. There is no cookie/token a user could clear to re-vote.

`song_ratings` has `PRIMARY KEY (song_id, voter_fp)`, so one listener gets one
vote per song. POSTing `rating: 0` deletes the row (toggle off); `1`/`-1` upsert.
Every ratings endpoint returns the same shape: `{ up, down, yourRating }`.

If you change the hashing or normalization, change it in **all three** files or
votes will silently stop matching.

## Frontend

`web/html/index.html` is the markup (no build step); logic lives in
`web/html/app.js` and styling in `web/html/styles.css`. It does not stream from
our backend — audio and metadata come from
external CloudFront URLs hardcoded in the script:

- HLS audio via `hls.js`; picks the **lossless FLAC** variant when the browser
  can decode it, else falls back to **AAC** (and falls back at runtime on a
  decode error). Safari/iOS use native HLS.
- Polls `metadatav2.json` every 10s for now-playing + previous tracks, refreshes
  `cover.jpg` (cache-busted) on track change, then fetches `/api/ratings` for the
  new song.

## File structure

```
.env                       credentials & host ports (Makefile includes this)
Makefile                   primary workflow — plain podman commands
compose.yaml               db + web only, NOT in sync (see gotchas above)
stream_URL.txt             the upstream HLS master playlist URL
RadioCalico_Style_Guide.txt   brand & UI style guide (text version) — see below
RadioCalico_Style_Guide.* / *.png / *.zip   design assets & mockups
app/
  server.js                Node ratings API (stdlib http, no framework)
  package.json             single dep: pg
  Dockerfile               node:20-alpine, runs as non-root
web/
  nginx.conf               server config: gzip, /healthz, /api/ proxy
  html/index.html          frontend markup
  html/app.js              frontend logic (HLS playback, metadata polling, ratings)
  html/styles.css          frontend styling
  html/logo.png            brand logo
db/
  init/01-init.sql         healthcheck table (runs on first DB init)
  init/02-ratings.sql      song_ratings schema + totals view
```

## Style guide

A text version of the styling guide for the page is at
**`RadioCalico_Style_Guide.txt`**. It defines the brand palette, typography
(Montserrat headings / Open Sans body), button/input/audio-control styles, and
layout/spacing rules. These are already encoded as CSS variables and component
styles in `web/html/styles.css` — follow the guide for any new or changed UI.

## Config

Credentials and host ports live in `.env` (local-dev only). The Makefile
`include`s it; the app container receives `PG*` env vars from those values.
