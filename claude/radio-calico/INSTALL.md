# Installing RadioCalico

RadioCalico is a local prototyping stack for a lossless-radio site. It runs as
three **rootless Podman** containers on a shared `radiocalico-net` network:

| Container         | Image               | Role                                              |
|-------------------|---------------------|---------------------------------------------------|
| `radiocalico-web` | nginx:1.27-alpine   | Serves the static site + reverse-proxies `/api/`  |
| `radiocalico-app` | built from `app/`   | Node ratings API on :3000 (stdlib `http`)         |
| `radiocalico-db`  | postgres:16-alpine  | Database; init SQL in `db/init/` runs on first boot |

## Prerequisites

- **Podman** (rootless) — `podman --version`
- **GNU Make** — drives the whole workflow (`make --version`)
- A POSIX shell. On Windows, use WSL2 or Git Bash; the Makefile uses
  `podman` directly (no compose tooling required).

> The `:Z` SELinux relabel flag is used on volume mounts. It is harmless on
> non-SELinux hosts.

## 1. Clone the repository

```sh
git clone https://github.com/DinaMMahfouz/radio-calico.git
cd radio-calico
```

## 2. Configure environment

Credentials and host ports live in `.env` (local-dev only, git-ignored). Copy
the template and edit if you need different ports or credentials:

```sh
cp .env.example .env
```

| Variable            | Default            | Purpose                                  |
|---------------------|--------------------|------------------------------------------|
| `POSTGRES_USER`     | `radiocalico`      | Database user                            |
| `POSTGRES_PASSWORD` | `radiocalico_dev`  | Database password (dev only)             |
| `POSTGRES_DB`       | `radiocalico`      | Database name                            |
| `DB_HOST_PORT`      | `5432`             | Host port the DB is published on         |
| `WEB_HOST_PORT`     | `8080`             | Host port the site is served on          |

## 3. Start the stack

```sh
make up
```

This builds the backend image, creates the network + volume, and starts all
three containers. When it finishes it prints the URLs:

- **Web**: http://localhost:8080
- **API**: http://localhost:8080/api/health
- **DB**:  `postgresql://radiocalico@localhost:5432/radiocalico`

## 4. Verify

```sh
curl localhost:8080/api/health                      # {"status":"ok"}
curl 'localhost:8080/api/ratings?artist=X&title=Y'  # {"up":0,"down":0,"yourRating":0}
```

Then open http://localhost:8080 in a browser.

## Common commands

```sh
make status     # show container status
make logs-app   # tail backend logs (also logs-web, logs-db, logs)
make psql       # open a psql shell into the database
make restart    # rebuild app image + recreate containers
make down       # stop & remove containers (DB volume preserved)
make db-reset   # DESTROY the DB volume and re-run db/init/*.sql
make clean      # remove containers + volume + network
```

## Notes when iterating

- **Backend code changes don't auto-apply.** `make up` only creates containers
  that don't already exist. After editing `app/server.js`, run `make restart`.
- **DB schema changes don't auto-apply.** `db/init/*.sql` runs only on first
  initialization of the volume. To pick up edits, `make db-reset` (this wipes
  all data).
- **`compose.yaml` is NOT in sync with the Makefile** — treat the Makefile as
  the source of truth.

## Troubleshooting

- **Port already in use**: change `WEB_HOST_PORT` / `DB_HOST_PORT` in `.env`,
  then `make restart`.
- **App can't reach the DB**: nginx and the app resolve `radiocalico-db` via
  Podman network DNS — confirm all three containers are up with `make status`.
- **Stale image after edits**: `make app` rebuilds only the backend image;
  `make restart` recreates the containers.
