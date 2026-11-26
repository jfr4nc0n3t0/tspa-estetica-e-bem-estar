#!/bin/sh
# Sobe o Supabase local, aplica o schema.sql e cria o login de teste.
set -e
cd "$(dirname "$0")"

EMAIL="${ADMIN_EMAIL:-dona@tspa.local}"
PASSWORD="${ADMIN_PASSWORD:-tspa-local-2026}"
API=http://localhost:54321

echo "→ Subindo os containers…"
./compose.sh up -d

echo "→ Esperando o login e a API ficarem prontos…"
i=0
until curl -sf "$API/auth/v1/health" >/dev/null 2>&1 && curl -sf "$API/rest/v1/" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "✗ Não subiu a tempo. Veja os logs com: sh admin/local/compose.sh logs"
    exit 1
  fi
  sleep 1
done

echo "→ Aplicando admin/supabase/schema.sql (dona: $EMAIL)…"
sed "s/seu-email@exemplo.com/$EMAIL/" ../supabase/schema.sql \
  | ./compose.sh exec -T -e PGOPTIONS="-c client_min_messages=warning" db psql -U postgres -v ON_ERROR_STOP=1 -q
./compose.sh exec -T db psql -U postgres -q -c "notify pgrst, 'reload schema'"

ANON=$(node keys.mjs anon)
SERVICE=$(node keys.mjs service_role)

echo "→ Criando o login de teste…"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/v1/admin/users" \
  -H "Authorization: Bearer $SERVICE" -H "apikey: $SERVICE" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"email_confirm\":true}")
case "$STATUS" in
  200|201) echo "  login criado." ;;
  422) echo "  login já existia (senha mantida)." ;;
  *) echo "  ✗ não consegui criar o login (HTTP $STATUS)"; exit 1 ;;
esac

cat > ../.env.docker.local <<ENV
# Gerado por admin/local/start.sh — aponta o painel para o Supabase local (Docker).
VITE_SUPABASE_URL=$API
VITE_SUPABASE_PUBLIC_KEY=$ANON
ENV

cat <<MSG

✓ Supabase local pronto.

  Painel:  npm --prefix admin run dev:local   →  http://localhost:5174
  Login:   $EMAIL
  Senha:   $PASSWORD
  E-mails de teste (Esqueci a senha):  http://localhost:54324

  Para testar o formulário tspa.com.br/agendar no site local:
  SUPABASE_URL=$API SUPABASE_PUBLIC_KEY=$ANON PORT=5173 npm run dev

  Parar (mantém os dados):    npm --prefix admin run local:stop
  Apagar tudo e recomeçar:    npm --prefix admin run local:reset
MSG
