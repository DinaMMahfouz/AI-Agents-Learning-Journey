# RadioCalico — local prototyping stack (rootless Podman)
# Usage: `make up`, `make down`, `make status`, `make logs`, `make psql`

include .env
export

NET        := radiocalico-net
PGVOL      := radiocalico-pgdata
DB_CT      := radiocalico-db
WEB_CT     := radiocalico-web
APP_CT     := radiocalico-app
PG_IMAGE   := docker.io/library/postgres:16-alpine
WEB_IMAGE  := docker.io/library/nginx:1.27-alpine
APP_IMAGE  := radiocalico-app:latest

.DEFAULT_GOAL := help

.PHONY: help up down restart status logs logs-db logs-web logs-app psql db-reset clean pull app

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

pull: ## Pre-pull container images
	podman pull $(PG_IMAGE)
	podman pull $(WEB_IMAGE)

app: ## Build the backend app image
	podman build -t $(APP_IMAGE) $(CURDIR)/app

up: app ## Create network + start database, backend app, and web server
	@podman network exists $(NET) || podman network create $(NET)
	@podman volume exists $(PGVOL) || podman volume create $(PGVOL)
	@podman container exists $(DB_CT) || podman run -d \
		--name $(DB_CT) --network $(NET) \
		-e POSTGRES_USER=$(POSTGRES_USER) \
		-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
		-e POSTGRES_DB=$(POSTGRES_DB) \
		-v $(PGVOL):/var/lib/postgresql/data \
		-v $(CURDIR)/db/init:/docker-entrypoint-initdb.d:ro,Z \
		-p $(DB_HOST_PORT):5432 \
		--health-cmd "pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB)" \
		--health-interval 5s \
		$(PG_IMAGE)
	@podman container exists $(APP_CT) || podman run -d \
		--name $(APP_CT) --network $(NET) \
		-e PGHOST=$(DB_CT) \
		-e PGUSER=$(POSTGRES_USER) \
		-e PGPASSWORD=$(POSTGRES_PASSWORD) \
		-e PGDATABASE=$(POSTGRES_DB) \
		$(APP_IMAGE)
	@podman container exists $(WEB_CT) || podman run -d \
		--name $(WEB_CT) --network $(NET) \
		-v $(CURDIR)/web/nginx.conf:/etc/nginx/nginx.conf:ro,Z \
		-v $(CURDIR)/web/html:/usr/share/nginx/html:ro,Z \
		-p $(WEB_HOST_PORT):80 \
		$(WEB_IMAGE)
	@echo ""
	@echo "  Web : http://localhost:$(WEB_HOST_PORT)"
	@echo "  API : http://localhost:$(WEB_HOST_PORT)/api/health"
	@echo "  DB  : postgresql://$(POSTGRES_USER)@localhost:$(DB_HOST_PORT)/$(POSTGRES_DB)"

down: ## Stop and remove containers (keeps DB data volume)
	-@podman rm -f $(WEB_CT) $(APP_CT) $(DB_CT) 2>/dev/null || true

restart: down up ## Recreate containers

status: ## Show container status
	@podman ps -a --filter name=radiocalico- \
		--format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

logs: ## Tail logs from both containers
	podman logs -f --tail 20 $(WEB_CT) $(DB_CT)

logs-db: ## Tail database logs
	podman logs -f --tail 50 $(DB_CT)

logs-web: ## Tail web server logs
	podman logs -f --tail 50 $(WEB_CT)

logs-app: ## Tail backend app logs
	podman logs -f --tail 50 $(APP_CT)

psql: ## Open a psql shell in the database
	podman exec -it $(DB_CT) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

db-reset: ## DESTROY db data and re-run init scripts
	-@podman rm -f $(DB_CT) 2>/dev/null || true
	-@podman volume rm $(PGVOL) 2>/dev/null || true
	@$(MAKE) up

clean: ## Remove containers, volume, and network
	-@podman rm -f $(WEB_CT) $(APP_CT) $(DB_CT) 2>/dev/null || true
	-@podman volume rm $(PGVOL) 2>/dev/null || true
	-@podman network rm $(NET) 2>/dev/null || true
	@echo "Cleaned up RadioCalico stack."
