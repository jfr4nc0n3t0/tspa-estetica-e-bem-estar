# Painel TSpa (admin.tspa.com.br)

Painel administrativo do TSpa: agenda, financeiro, clientes, leads e serviços.
Funciona no celular (barra de navegação embaixo) e no computador, com modo claro e escuro.

O que tem em cada lugar:

| Onde | O que é |
| --- | --- |
| `admin/` | O painel. É um app separado do site, publicado no Cloudflare Pages. |
| `admin/supabase/schema.sql` | O script único do banco (tabelas, regras de conflito, segurança). |
| `client/src/pages/Agendar.tsx` | A página pública `tspa.com.br/agendar` (formulário de interesse). |
| `functions/api/leads.ts` | A rota `POST /api/leads` (Cloudflare), que recebe o formulário e grava o lead no Supabase. |

> **Importante:** site e painel publicam sozinhos (Cloudflare Pages) a cada push na `main`.

---

## A) Criar o projeto no Supabase e rodar o SQL

1. Entre em **supabase.com** → **Start your project** e faça login (pode ser com o GitHub).
2. **New project**:
   - **Name:** `tspa`
   - **Database Password:** clique em *Generate a password* e **guarde essa senha** (num gerenciador de senhas).
   - **Region:** *South America (São Paulo)*.
   - Clique em **Create new project** e espere uns 2 minutos.
3. Abra o arquivo `admin/supabase/schema.sql`, vá até o **final** e troque
   `seu-email@exemplo.com` pelo e-mail que você vai usar para entrar no painel.
4. No Supabase, menu da esquerda → **SQL Editor** → **New query**. Cole o arquivo inteiro e clique em **Run**.
   Deve aparecer *Success. No rows returned*.
5. **Criar o seu usuário:** menu **Authentication** → **Users** → **Add user** → **Create new user**.
   - Use **o mesmo e-mail** do passo 3 e uma senha forte.
   - Deixe marcado **Auto Confirm User**.
6. **Fechar o cadastro público** (ninguém mais consegue criar conta):
   **Authentication** → **Sign In / Providers** (em alguns painéis: *Settings*) →
   desligue **Allow new users to sign up** → **Save**.
7. **Link de "Esqueci a senha":** **Authentication** → **URL Configuration**:
   - **Site URL:** `https://admin.tspa.com.br`
   - Em **Redirect URLs**, adicione também `http://localhost:5174` (para testes no computador).

Pode rodar o script de novo no futuro sem perder dados (ex.: quando ele for atualizado).
Para dar acesso a outro e-mail, rode só a última parte do script com o novo e-mail.

## B) Pegar a URL e a chave pública do Supabase

No Supabase: **Project Settings** (engrenagem) → **API Keys** e **Data API**.

- **Project URL** — algo como `https://abcdefgh.supabase.co`
- **Chave pública** — a **Publishable key** (`sb_publishable_...`). Em projetos antigos, a **anon public**.

> 🔒 **Nunca** use a chave **secret** / **service_role** no painel nem no site. Ela ignora todas as
> regras de segurança. Se colar por engano, o painel mostra a tela "Chave errada".

Onde colocar:

| Lugar | Variáveis |
| --- | --- |
| Painel no Cloudflare Pages (passo D) | `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLIC_KEY` |
| Site no Cloudflare Pages (passo C) | `SUPABASE_URL` e `SUPABASE_PUBLIC_KEY` |
| Seu computador (opcional) | arquivo `admin/.env.local` (copie de `admin/.env.example`) |

A chave pública pode aparecer no navegador sem problema: as regras do banco (RLS) só deixam a
dona ler e escrever, e o visitante do site só consegue **inserir** um lead, nunca ler.

## C) Site: variáveis do formulário

O site (`tspa.com.br`) está no Cloudflare Pages, no projeto `tspa-site` (veja `CLOUDFLARE.md` na raiz).
O formulário `/agendar` precisa de duas variáveis nesse projeto (**Settings** → **Variables and Secrets**):

- `SUPABASE_URL` = a Project URL (ex.: `https://xxxx.supabase.co`, sem nada depois)
- `SUPABASE_PUBLIC_KEY` = a chave pública, **a mesma** usada no painel (`VITE_SUPABASE_PUBLIC_KEY`)

Depois de mudar: **Deployments** → **Retry deployment**.

## D) Painel no Cloudflare Pages

1. Entre em **dash.cloudflare.com** (crie a conta grátis; não precisa mudar o DNS para a Cloudflare).
2. **Workers & Pages** → **Create** → aba **Pages** → **Connect to Git** → autorize o GitHub e escolha o
   repositório `tspa-estetica-e-bem-estar`.
3. Em **Set up builds and deployments**:
   - **Project name:** `tspa-admin` (vira o endereço `tspa-admin.pages.dev`)
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory (advanced):** `admin`
   - **Environment variables (advanced):**
     - `VITE_SUPABASE_URL` = a Project URL
     - `VITE_SUPABASE_PUBLIC_KEY` = a chave pública
     - `NODE_VERSION` = `20`
4. **Save and Deploy**. Em 1–2 minutos, abra `https://tspa-admin.pages.dev` e entre com o login do passo A.5.
   As rotas (ex.: `/financeiro`) já funcionam: o arquivo `admin/public/_redirects` cuida disso.
5. Para o painel só ser publicado quando algo mudar nele: **Settings** → **Builds & deployments** →
   **Build watch paths** → em **Include paths** coloque `admin/**` (com dois asteriscos, para valer também
   para as subpastas como `admin/src/...`).

> Se mudar as variáveis depois, vá em **Deployments** → **Retry deployment** para elas valerem.

## E) Domínio admin.tspa.com.br (Registro.br + Cloudflare)

1. No projeto `tspa-admin` da Cloudflare: **Custom domains** → **Set up a custom domain** →
   `admin.tspa.com.br` → **Continue**. Ela mostra que precisa de um **CNAME** para `tspa-admin.pages.dev`.
2. **registro.br** → **Entrar** → `tspa.com.br` → seção **DNS** → **Editar zona** → **Nova entrada**:
   - **Tipo:** `CNAME`
   - **Nome:** `admin`
   - **Dados:** `tspa-admin.pages.dev` (sem `https://`)
3. **Salvar alterações**. Não mexa nas entradas que já existem de `tspa.com.br` e `www`: elas são do site.
4. Volte à Cloudflare e clique em **Check DNS records** (ou espere): leva de minutos a algumas horas.
   Quando ficar **Active**, o cadeado (SSL) já vem pronto.
5. Teste `https://admin.tspa.com.br`.

## F) Primeiro uso

1. Abra `https://admin.tspa.com.br` e entre com o e-mail e a senha do passo A.5.
2. Em **Mais → Serviços**, defina o preço de cada serviço (vêm do site com "definir preço").
   Em **Mais → Profissionais**, confira o nome da profissional (o script cria "Thauany Santos").
3. Em **Mais → Horário de funcionamento**, ajuste se não for 08:00–20:00.
4. Quer testar antes? **Mais → Dados de exemplo → Carregar exemplos**. Depois, **Apagar exemplos**
   remove só o que tem "(exemplo)", sem tocar nos seus dados.
5. Links do formulário de interesse (copie em **Mais → Formulário de interesse**):
   - Bio do Instagram: `https://tspa.com.br/agendar?origem=instagram`
   - Geral: `https://tspa.com.br/agendar`

## Como as regras funcionam

- **Mesma sala, mesmo horário:** bloqueado.
- **Profissionais:** cada profissional faz um atendimento por vez, em qualquer sala. Com mais de
  uma cadastrada (**Mais → Profissionais**), elas podem atender ao mesmo tempo em salas diferentes,
  e o agendamento pergunta com quem é. Com uma só, ela é escolhida automaticamente.
- **Sala 2:** desativada por padrão. Ligue em **Mais → Salas**. Ligada, aceita um atendimento ao
  mesmo tempo que a Sala 1: um serviço que **não precisa de profissional** (marque isso no serviço,
  ex.: Ofurô) ou o atendimento de outra profissional.
- **Fechamento:** nenhum atendimento passa do horário de fechamento.
- **Cancelado/Faltou** liberam o horário.
- **Pago:** marcar "Pago" cria a entrada no Financeiro; desmarcar (ou cancelar) remove.
- Essas regras valem no painel **e** no banco de dados, então nada passa por engano.

## Testar no computador com Docker (sem conta no Supabase)

A pasta `admin/local/` sobe uma versão enxuta do Supabase no Docker (banco, login e API), com o
`schema.sql` já aplicado e um login de teste. Nada disso vai para o ar.

```bash
npm --prefix admin install
```

```bash
npm --prefix admin run local:up
```

```bash
npm --prefix admin run dev:local
```

Abra `http://localhost:5174` e entre com o login de teste:

| | |
| --- | --- |
| E-mail | `dona@tspa.local` |
| Senha | `tspa-local-2026` |

Para usar outro e-mail/senha: `ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD=outra-senha npm --prefix admin run local:up`.

- **Dados de exemplo:** no painel, em **Mais → Dados de exemplo → Carregar exemplos**.
- **"Esqueci a senha":** os e-mails de teste chegam em `http://localhost:54324`.
- **Formulário `/agendar` no site local:** o `local:up` mostra no final o comando para rodar o site já ligado a esse banco.
- **Parar** (mantém os dados): `npm --prefix admin run local:stop` · **Apagar tudo e recomeçar:** `npm --prefix admin run local:reset`.

O arquivo `admin/.env.docker.local` é criado sozinho e só vale para o `dev:local`. Para testar com o
Supabase de verdade, use `admin/.env.local` (copie de `admin/.env.example`) e `npm --prefix admin run dev`.

## Backup e restauração

O Supabase grátis não faz backup diário. Faça o seu (sugestão: **toda semana** e antes de qualquer mudança grande).
Precisa do Docker ligado (no Mac com Colima: `colima start`).

**1. Uma vez só: guardar a conexão do banco**

No Supabase, clique em **Connect** (topo da tela) → aba **Connection String** → **Session pooler** → copie.
Copie `admin/backup/.env.backup.example` para `admin/backup/.env.backup.local` e cole a conexão em
`SUPABASE_DB_URL`, trocando `[YOUR-PASSWORD]` pela senha do banco (passo A.2). Esse arquivo nunca vai para o GitHub.

> Use o **Session pooler**: a conexão "Direct" do plano grátis não funciona na maioria das redes de casa.

**2. Fazer o backup**

```bash
npm --prefix admin run backup
```

Cria a pasta `~/TSpa-backups/tspa-backup-AAAA-MM-DD_HHMM` com:

| Arquivo | Para quê |
| --- | --- |
| `dados.sql` | todos os dados do painel, para restaurar |
| `usuarios.sql` | os logins (e-mail e senha embaralhada) |
| `estrutura.sql` | a estrutura do banco naquele dia |
| `clientes.csv`, `agendamentos.csv`, `lancamentos.csv`… | planilhas para abrir no Excel/Google Planilhas |

> 🔒 O backup tem dados pessoais e de saúde (LGPD). Guarde em local seguro (ex.: um HD externo ou uma pasta
> com acesso restrito) e não compartilhe.

**3. Restaurar (ou migrar para outro projeto Supabase)**

```bash
npm --prefix admin run restore -- ~/TSpa-backups/tspa-backup-AAAA-MM-DD_HHMM
```

O script pede a conexão do banco de **destino**, pede para você digitar `RESTAURAR` e:
1. cria/atualiza a estrutura com o `schema.sql` atual;
2. **apaga os dados do painel no destino** e carrega os do backup;
3. pergunta se deve restaurar os logins. Responda `s` só num projeto novo, sem usuários.

Para **migrar** para um projeto novo: faça o backup do antigo, crie o projeto novo, rode o `restore`
apontando para ele (respondendo `s` para os logins) e troque a URL e a chave pública nos dois projetos do
Cloudflare Pages: `tspa-site` (passo C) e `tspa-admin` (passo D).

## Custos e cuidados

- **Supabase grátis:** pausa o projeto depois de 7 dias sem uso e não tem backup diário.
  Quando o painel virar rotina, vale o **Pro (US$ 25/mês)**: backup diário e sem pausa.
- **LGPD:** a anamnese é dado de saúde. Registre só o necessário. Se uma cliente pedir, exclua o
  cadastro dela (Clientes → Excluir apaga também o histórico).
- Ative a **verificação em duas etapas** nas contas do Supabase, Cloudflare, GitHub e Registro.br.

## Próximos passos (opcionais)

1. **Lembretes automáticos no WhatsApp** (ex.: um dia antes do atendimento):
   - **API oficial do WhatsApp (Meta Cloud API):** mais estável e sem risco de bloqueio do número;
     exige conta Business verificada e modelos de mensagem aprovados. Cobra por conversa.
   - **Z-API:** mais fácil de começar (conecta pelo QR Code), mensalidade fixa, mas não é oficial:
     há risco de o número ser bloqueado se enviar demais.
   - Em ambos: uma *Edge Function* do Supabase rodando todo dia (agendada com `pg_cron`) busca os
     agendamentos de amanhã e envia a mensagem.
2. **Pix integrado** (**Mercado Pago** ou **Asaas**): gerar a cobrança Pix pelo agendamento e,
   quando o pagamento cair, o aviso automático (webhook) marca o agendamento como **pago** e a
   entrada aparece sozinha no Financeiro. O Asaas também emite boleto e nota fiscal de serviço.
