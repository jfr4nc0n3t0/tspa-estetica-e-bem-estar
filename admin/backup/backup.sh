#!/bin/sh
# =====================================================================
# Backup do banco do painel TSpa (Supabase)
#
#   npm --prefix admin run backup
#
# Gera uma pasta com:
#   dados.sql      → todos os dados do painel (para restaurar)
#   usuarios.sql   → logins (e-mail e senha embaralhada) do Supabase Auth
#   estrutura.sql  → cópia do schema.sql usado
#   *.csv          → planilhas para abrir no Excel/Google Planilhas
#
# Precisa do Docker ligado (no Mac com Colima: `colima start`).
# A conexão vem de SUPABASE_DB_URL ou do arquivo admin/backup/.env.backup.local;
# se não houver, o script pergunta (sem mostrar na tela).
# =====================================================================
set -e
cd "$(dirname "$0")"

if [ -f .env.backup.local ]; then
  # shellcheck disable=SC1091
  . ./.env.backup.local
fi

URL="${SUPABASE_DB_URL:-}"
if [ -z "$URL" ]; then
  printf "Cole a connection string do Supabase (Session pooler) e tecle Enter: "
  stty -echo 2>/dev/null || true
  read -r URL
  stty echo 2>/dev/null || true
  echo
fi
if [ -z "$URL" ]; then
  echo "✗ Sem connection string. Veja o README (seção Backup)."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "✗ O Docker não está ligado. No Mac com Colima, rode: colima start"
  exit 1
fi

OUT_ROOT="${BACKUP_DIR:-$HOME/TSpa-backups}"
OUT="$OUT_ROOT/tspa-backup-$(date +%Y-%m-%d_%H%M)"
mkdir -p "$OUT"
chmod 700 "$OUT_ROOT" "$OUT"

IMAGE=postgres:17-alpine   # pg_dump 17 funciona com bancos 15 e 17
pg() {
  # A senha vai por variável de ambiente, não aparece na linha de comando
  docker run --rm -i --add-host=host.docker.internal:host-gateway \
    -e DBURL="$URL" -e PGCONNECT_TIMEOUT=20 "$IMAGE" sh -c "$1" \
    | sed '/^SET transaction_timeout/d'   # opção do pg_dump 17 que bancos mais antigos não aceitam
}

echo "→ Testando a conexão…"
pg 'psql "$DBURL" -tAc "select 1"' >/dev/null

echo "→ Exportando os dados do painel…"
{
  echo "-- Backup TSpa: dados do painel ($(date '+%d/%m/%Y %H:%M'))"
  echo "SET session_replication_role = replica;  -- restaura sem disparar as regras automáticas"
  pg 'pg_dump "$DBURL" --data-only --schema=public --no-owner --no-privileges'
} > "$OUT/dados.sql"

echo "→ Exportando os logins…"
{
  echo "-- Backup TSpa: usuários do login ($(date '+%d/%m/%Y %H:%M'))"
  echo "SET session_replication_role = replica;"
  pg 'pg_dump "$DBURL" --data-only --table=auth.users --table=auth.identities --no-owner --no-privileges'
} > "$OUT/usuarios.sql"

cp ../supabase/schema.sql "$OUT/estrutura.sql"

echo "→ Gerando planilhas (CSV)…"
csv() {
  pg "psql \"\$DBURL\" -v ON_ERROR_STOP=1 -q -c \"\\copy ($2) to stdout with csv header\"" > "$OUT/$1.csv"
}
csv clientes "select * from public.clients order by name"
csv agendamentos "select a.*, c.name as cliente from public.appointments a left join public.clients c on c.id = a.client_id order by a.starts_at"
csv lancamentos "select * from public.transactions order by date"
csv despesas_fixas "select * from public.recurring_expenses order by description"
csv leads "select * from public.leads order by created_at"
csv servicos "select * from public.services order by name"
csv profissionais "select * from public.professionals order by name"

cat > "$OUT/LEIA-ME.txt" <<TXT
Backup do painel TSpa — $(date '+%d/%m/%Y %H:%M')

ATENÇÃO: contém dados pessoais e de saúde das clientes (LGPD).
Guarde em local seguro e não compartilhe.

- dados.sql e usuarios.sql: para restaurar (veja "Backup e restauração" no admin/README.md)
- estrutura.sql: a estrutura do banco usada neste backup
- *.csv: planilhas para consulta (abrem no Excel ou Google Planilhas)
TXT

chmod 600 "$OUT"/*
echo
echo "✓ Backup salvo em: $OUT"
ls -lh "$OUT" | awk 'NR>1 {print "   " $5 "\t" $9}'
