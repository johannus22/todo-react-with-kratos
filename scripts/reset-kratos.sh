#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

echo "Resetting Kratos database volume..."
docker-compose down

kratos_volumes="$(docker volume ls -q --filter name=kratos-db-data)"
if [[ -n "$kratos_volumes" ]]; then
  docker volume rm $kratos_volumes
fi

echo "Starting Kratos services..."
docker-compose up -d kratos-db kratos-migrate kratos

ready_url="http://localhost:4434/health/ready"
echo "Waiting for Kratos admin API..."
for _ in {1..30}; do
  if curl -fsS "$ready_url" > /dev/null; then
    break
  fi
  sleep 2
done

identity_path="$repo_root/kratos/admin.identity.json"
if [[ ! -f "$identity_path" ]]; then
  echo "Admin identity JSON not found at $identity_path" >&2
  exit 1
fi

echo "Seeding admin identity (admin@todo.app)..."
if curl -fsS -X POST "http://localhost:4434/admin/identities" \
  -H "Content-Type: application/json" \
  --data-binary @"$identity_path" > /dev/null; then
  echo "Admin identity created."
else
  if curl -sS -o /dev/null -w "%{http_code}" -X POST "http://localhost:4434/admin/identities" \
    -H "Content-Type: application/json" \
    --data-binary @"$identity_path" | grep -q "409"; then
    echo "Admin identity already exists. Skipping create."
  else
    echo "Failed to create admin identity." >&2
    exit 1
  fi
fi

echo "Done. Admin login: admin@todo.app / admin123!"
