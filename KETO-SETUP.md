# Keto Setup (Backend)

This project runs Ory Keto via Docker Compose and exposes read/write APIs for todo authorization.

## Services and Ports

- Keto Read API: `http://localhost:4466`
- Keto Write API: `http://localhost:4467`
- Keto Postgres: `localhost:5433` (inside Docker: `keto-db:5432`)

## Start Keto

From the repo root:

```bash
docker-compose up -d keto-db keto-migrate keto
```

## Health Check

```bash
curl http://localhost:4466/health/ready
```

## Required Backend Env Vars

Set these in your backend environment (worker, server, etc.):

```
KETO_READ_URL=http://localhost:4466
KETO_WRITE_URL=http://localhost:4467
```

## Namespace

Keto namespaces are defined in `keto/keto.yml`. This project uses:

- `todos`

## Relation Tuple Pattern (suggested)

Use a single ownership relation for each todo:

```
namespace: todos
object: <todo-id>
relation: owner
subject: user:<kratos-identity-id>
```

## Common Errors

- Using read URL for write operations (or vice versa).
- Wrong namespace (`todos`) or mismatched todo IDs.
- Backend does not forward `X-User-Id` to Keto checks.

## Notes

- Keto read API is for `check` and `expand` operations.
- Keto write API is for creating/deleting relation tuples.
