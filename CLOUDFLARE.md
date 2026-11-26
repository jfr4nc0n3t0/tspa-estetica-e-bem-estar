# Mudar o site do Render para a Cloudflare (grátis)

> ✅ Migração concluída em 26/11/2026: site, formulário e painel estão no Cloudflare Pages e o DNS está na Cloudflare.

O site (`tspa.com.br`), o formulário `/agendar` e o painel (`admin.tspa.com.br`) passam a ficar todos
na Cloudflare, no plano grátis. O registro do domínio continua no Registro.br (mesma renovação anual).

| Parte | Onde fica | Como |
| --- | --- | --- |
| Site e página `/agendar` | Cloudflare Pages, projeto `tspa-site` | arquivos prontos gerados por `npm run build:pages` |
| Formulário (`POST /api/leads`) | Cloudflare Pages Functions | `functions/api/leads.ts` |
| Painel | Cloudflare Pages, projeto `tspa-admin` | veja `admin/README.md` |
| Banco e login | Supabase | não muda |

> **Ordem segura:** o Render continua no ar até o fim. Só cancele depois do passo 5.

---

## 1. Criar o projeto do site no Cloudflare Pages

1. **dash.cloudflare.com** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
   → repositório `tspa-estetica-e-bem-estar` → **Begin setup**.
2. Preencha:
   - **Project name:** `tspa-site`
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** `npm run build:pages`
   - **Build output directory:** `dist/public`
   - **Root directory:** deixe vazio (é a raiz do repositório)
   - **Environment variables:**
     - `SUPABASE_URL` = a Project URL do Supabase
     - `SUPABASE_PUBLIC_KEY` = a chave pública (publishable/anon)
     - `NODE_VERSION` = `20`
3. **Save and Deploy**. Ao terminar, teste em `https://tspa-site.pages.dev`:
   - a página inicial abre normalmente;
   - `https://tspa-site.pages.dev/agendar` mostra o formulário; envie um contato de teste e confira em **Leads** no painel (depois exclua);
   - `https://tspa-site.pages.dev/qualquer-coisa` mostra "Página não encontrada".
4. Para não publicar o site quando só o painel mudar: **Settings** → **Builds & deployments** →
   **Build watch paths** → em **Exclude paths** coloque `admin/*` (se a opção existir na sua tela).

> Mudou alguma variável depois? **Deployments** → **Retry deployment** para ela valer.

## 2. Proteção "não sou robô" com Turnstile

Grátis e quase sempre invisível para quem preenche. Substitui o limite de envios que existia no Render.
O widget **já foi criado** (Site Key `0x4AAAAAAGUQ_qib4b2dipv4`); falta só ligar no projeto.

1. Cloudflare → **Turnstile** → abra o widget → confira em **Hostname Management** que estão cadastrados
   `tspa.com.br`, `www.tspa.com.br` e o endereço do projeto (ex.: `tspa-site.pages.dev`). Sem isso, o
   formulário não libera o botão de enviar nesse endereço.
2. No projeto `tspa-site` → **Settings** → **Variables and Secrets** → **Add**:
   - `VITE_TURNSTILE_SITE_KEY` = `0x4AAAAAAGUQ_qib4b2dipv4` (pública, vai para a página)
   - `TURNSTILE_SECRET_KEY` = a **Secret Key** do widget → tipo **Secret** (nunca compartilhe; não cole em chats)
   - `TURNSTILE_HOSTNAMES` = `tspa.com.br,www.tspa.com.br,tspa-site.pages.dev` (opcional; o servidor só aceita
     verificações feitas nesses endereços)
3. **Deployments** → **Retry deployment** (a Site Key entra no site na hora do build).
4. Teste em `https://tspa-site.pages.dev/agendar`: preencha e espere um instante; o botão libera sozinho e o
   envio aparece em **Leads**.

> No computador (`npm run dev`), o widget só aparece se você definir `VITE_TURNSTILE_SITE_KEY`. Para testes
> use a chave pública de teste da Cloudflare `1x00000000000000000000AA` (e, no servidor,
> `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`), que sempre aprova.

## 3. Passar o DNS do domínio para a Cloudflare

O endereço `tspa.com.br` (sem www) só pode apontar para a Cloudflare se o DNS estiver na Cloudflare.

1. **Antes de tudo, anote o DNS atual:** Registro.br → `tspa.com.br` → **DNS** → **Editar zona** →
   tire um print de todas as entradas (principalmente **MX** e **TXT**, se você tiver e-mail no domínio).
2. Cloudflare → **Add a domain** (ou **Onboard a domain**) → `tspa.com.br` → plano **Free**.
3. A Cloudflare lê as entradas atuais. **Compare com o print**: tudo de e-mail (MX, TXT/SPF, DKIM)
   e o CNAME `admin` precisam estar lá. Adicione o que faltar.
4. Ela mostra **dois servidores de nome** (ex.: `ana.ns.cloudflare.com` e `bob.ns.cloudflare.com`).
5. Registro.br → `tspa.com.br` → **DNS** → **Alterar servidores DNS** → cole os dois da Cloudflare → salvar.
6. Espere a Cloudflare mostrar o domínio como **Active** (minutos a algumas horas; ela manda e-mail).
   Enquanto isso, o site continua abrindo pelo Render normalmente.

## 4. Apontar tspa.com.br e www para o projeto novo

1. Projeto `tspa-site` → **Custom domains** → **Set up a custom domain** → `tspa.com.br` → **Activate domain**.
   Se a Cloudflare avisar que já existe uma entrada para esse nome (a antiga, do Render), aceite trocar.
2. Repita para `www.tspa.com.br`.
3. O painel (`admin.tspa.com.br`) continua funcionando: o CNAME dele foi copiado no passo 3.
4. (Opcional) Para `www` sempre ir para o endereço sem www: **Rules** → **Redirect Rules** →
   **Create rule** → modelo "Redirect from WWW to root".

## 5. Conferir e cancelar o Render

1. Abra `https://tspa.com.br`, `https://tspa.com.br/agendar` (envie um teste) e `https://admin.tspa.com.br`.
2. Tudo certo? No Render, **remova os domínios** do serviço e depois **suspenda ou exclua** o serviço
   e cancele o plano.

## Rodar no computador do jeito da Cloudflare (opcional)

```bash
npm run build:pages
```

```bash
npx wrangler pages dev dist/public
```

As variáveis do formulário vão em um arquivo `.dev.vars` na raiz (fora do GitHub), por exemplo:
`SUPABASE_URL=http://localhost:54321` e `SUPABASE_PUBLIC_KEY=...` (veja o banco local em `admin/README.md`).
