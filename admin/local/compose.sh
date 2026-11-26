#!/bin/sh
# Usa "docker compose" ou "docker-compose" (Colima/Homebrew), o que estiver instalado.
cd "$(dirname "$0")"
if docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
else
  exec docker-compose "$@"
fi
