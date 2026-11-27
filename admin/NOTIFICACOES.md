# Notificações no celular (resumo do dia e lembretes)

O painel avisa no celular, mesmo fechado:

- **Resumo do dia** no horário escolhido (padrão 7h30): "Hoje: 3 atendimentos" com horário, primeiro nome e serviço.
- **Lembrete** antes de cada atendimento (padrão 30 min): "Em 30 min · 10:00 — Carla · Massagem Relaxante · Sala 1".
- **Pendências no fim do dia** (30 min depois do fechamento): "2 atendimentos de hoje sem status". Tocando, abre a
  Agenda já na lista para marcar Concluído, Faltou ou Cancelado.

Dia sem atendimento não gera aviso. Cancelados e faltas não avisam. Se remarcar, o lembrete vale para o horário novo.
Horário e antecedência ficam em **Mais → Notificações** no painel.

## Como funciona

| Parte | Onde fica |
| --- | --- |
| Botão "Ativar neste aparelho" e ajustes | `admin/src/pages/NotificationsSettings.tsx` |
| Recebe e mostra a notificação no celular | `admin/public/sw.js` |
| Aparelhos ativados e registro do que já foi enviado | tabelas `push_subscriptions` e `push_log` (`admin/supabase/schema.sql`, seção 8d) |
| Decide o que mandar e envia | função `push-agenda` no Supabase (`admin/supabase/functions/push-agenda/`) |
| Chama a função a cada 5 minutos | agendador do banco (`admin/supabase/notificacoes-agendador.sql`) |

## Configurar (uma vez)

Faça na ordem.

### 1. Gerar as chaves

No computador, na pasta do projeto:

```bash
npm --prefix admin run push:keys
```

Sai uma chave pública, uma privada e um `CRON_SECRET`. Guarde num gerenciador de senhas.
**A chave privada e o `CRON_SECRET` nunca vão para o GitHub nem para chats.**

### 2. Atualizar o banco

Supabase → **SQL Editor** → cole o `admin/supabase/schema.sql` inteiro → **Run**.

### 3. Segredos da função

Supabase → **Edge Functions** → **Secrets** → adicione:

| Nome | Valor |
| --- | --- |
| `VAPID_PUBLIC_KEY` | a chave pública do passo 1 |
| `VAPID_PRIVATE_KEY` | a chave privada do passo 1 |
| `VAPID_SUBJECT` | `mailto:` + o seu e-mail (ex.: `mailto:contato@tspa.com.br`) |
| `CRON_SECRET` | o `CRON_SECRET` do passo 1 |

### 4. Publicar a função

No computador, na pasta `admin`:

```bash
npx supabase login
```

```bash
npx supabase functions deploy push-agenda --project-ref SEU-PROJETO
```

`SEU-PROJETO` é o código do projeto (o `xxxx` de `https://xxxx.supabase.co`).
O arquivo `admin/supabase/config.toml` já diz que a função faz a própria verificação de acesso.

### 5. Ligar o agendador

Abra `admin/supabase/notificacoes-agendador.sql`, copie o conteúdo para o **SQL Editor** do Supabase e,
**lá no editor** (não no arquivo do projeto), troque `SEU-PROJETO` e `COLE-O-CRON-SECRET`. Clique em **Run**.

### 6. Chave pública no painel

Cloudflare → **Workers & Pages** → projeto do painel (`tspa-admin`) → **Settings** → **Variables and Secrets**:

- `VITE_VAPID_PUBLIC_KEY` = a chave pública do passo 1

Depois **Deployments** → **Retry deployment**.

### 7. Ativar no celular

1. Instale o painel na tela de início (iPhone: Safari → Compartilhar → Adicionar à Tela de Início;
   Android: Chrome → ⋮ → Instalar app). No iPhone é obrigatório e precisa do iOS 16.4 ou mais novo.
2. Abra o painel pelo ícone → **Mais → Notificações** → **Ativar neste aparelho** → permita.
3. Toque em **Enviar teste**. Deve chegar em alguns segundos.

Repita o passo 7 em cada aparelho que deve receber os avisos.

## Se não chegar

No **SQL Editor** do Supabase:

```sql
-- O agendador está rodando?
select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
-- O que a função respondeu? (200 = ok, 401 = CRON_SECRET diferente, 500 = faltam segredos)
select status_code, content, created from net._http_response order by created desc limit 5;
-- Aparelhos ativados
select device, created_at, last_success_at from push_subscriptions;
```

Os logs da função ficam em Supabase → **Edge Functions** → `push-agenda` → **Logs**.

Para desligar tudo: `select cron.unschedule('push-agenda');`
