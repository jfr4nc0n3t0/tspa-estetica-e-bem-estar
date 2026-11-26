#!/bin/sh
# =====================================================================
# Restaura um backup do painel TSpa num banco Supabase.
#
#   npm --prefix admin run restore -- ~/TSpa-backups/tspa-backup-AAAA-MM-DD_HHMM
#
# ATENÇÃO: APAGA os dados do painel que estiverem no banco de destino
# e coloca os do backup no lugar. Os logins só são restaurados se você
# confirmar (útil ao migrar para um projeto novo).
#
# Precisa do Docker ligado. A conexão de destino vem de SUPABASE_DB_URL_DESTINO,
# ou do arquivo admin/backup/.env.backup.local, ou é perguntada.
# =====================================================================
set -e
cd "$(dirname "$0")"

DIR="$1"
if [ -z "$DIR" ] || [ ! -f "$DIR/dados.sql" ]; then
  echo "Uso: npm --prefix admin run restore -- <pasta-do-backup>"
  echo "     (a pasta precisa ter o arquivo dados.sql)"
  exit 1
fi
DIR="$(cd "$DIR" && pwd)"

if [ -f .env.backup.local ]; then
  # shellcheck disable=SC1091
  . ./.env.backup.local
fi
URL="${SUPABASE_DB_URL_DESTINO:-}"
if [ -z "$URL" ]; then
  printf "Cole a connection string do banco de DESTINO (Session pooler) e tecle Enter: "
  stty -echo 2>/dev/null || true
  read -r URL
  stty echo 2>/dev/null || true
  echo
fi
[ -n "$URL" ] || { echo "✗ Sem connection string."; exit 1; }

docker info >/dev/null 2>&1 || { echo "✗ O Docker não está ligado. No Mac com Colima, rode: colima start"; exit 1; }

echo "Isto vai APAGAR os dados do painel no banco de destino e colocar os do backup:"
echo "   $DIR"
printf "Para continuar, digite RESTAURAR: "
read -r CONFIRM
[ "$CONFIRM" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }

IMAGE=postgres:17-alpine
psql_file() {
  sed '/^SET transaction_timeout/d' "$1" | docker run --rm -i --add-host=host.docker.internal:host-gateway \
    -e DBURL="$URL" -e PGCONNECT_TIMEOUT=20 -e PGOPTIONS="-c client_min_messages=warning" \
    "$IMAGE" sh -c 'psql "$DBURL" -v ON_ERROR_STOP=1 -q -o /dev/null'
}
psql_cmd() {
  echo "$1" | docker run --rm -i --add-host=host.docker.internal:host-gateway \
    -e DBURL="$URL" -e PGCONNECT_TIMEOUT=20 -e PGOPTIONS="-c client_min_messages=warning" \
    "$IMAGE" sh -c 'psql "$DBURL" -v ON_ERROR_STOP=1 -q -o /dev/null'
}

echo "→ Criando/atualizando a estrutura (schema.sql atual)…"
psql_file ../supabase/schema.sql

echo "→ Limpando os dados atuais do painel…"
psql_cmd "truncate public.admin_users, public.settings, public.services, public.professionals, public.clients,
  public.appointments, public.transactions, public.recurring_expenses, public.leads cascade;"

echo "→ Carregando os dados do backup…"
psql_file "$DIR/dados.sql"

printf "Restaurar também os logins (e-mail e senha)? Só faça isso num projeto novo, sem usuários. [s/N] "
read -r USERS
if [ "$USERS" = "s" ] || [ "$USERS" = "S" ]; then
  echo "→ Restaurando os logins…"
  psql_file "$DIR/usuarios.sql"
fi

psql_cmd "notify pgrst, 'reload schema';"
echo
echo "✓ Restauração concluída."
