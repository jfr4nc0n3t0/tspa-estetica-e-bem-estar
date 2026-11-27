// Supabase Edge Function "push-agenda": envia as notificações do painel.
//   • Chamada a cada 5 minutos pelo agendador do banco (cabeçalho x-cron-secret).
//   • Chamada pelo painel com { "action": "test" } para mandar uma notificação de teste
//     (só a dona logada consegue).
// Segredos necessários (Supabase → Edge Functions → Secrets): veja admin/NOTIFICACOES.md.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { runNotifications, type SendFn } from "./core.ts";

const env = (name: string) => Deno.env.get(name) ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Comparação que não vaza o segredo pelo tempo de resposta */
function sameSecret(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** A chamada vem da dona logada no painel? (confere o login e a lista admin_users com a chave de serviço) */
async function isAdmin(db: SupabaseClient, authorization: string | null) {
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const { data, error } = await db.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return false;
  const { data: admins } = await db.from("admin_users").select("email");
  return (admins ?? []).some((a: { email: string }) => a.email.toLowerCase() === email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const fromCron = sameSecret(req.headers.get("x-cron-secret") ?? "", env("CRON_SECRET"));
  const body = await req.json().catch(() => ({}));
  const test = body?.action === "test";

  if (!env("SUPABASE_URL") || !env("SUPABASE_SERVICE_ROLE_KEY")) {
    return json({ error: "A função não recebeu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY do Supabase." }, 500);
  }
  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

  if (!fromCron) {
    if (!test) return json({ error: "Não autorizado" }, 401);
    if (!(await isAdmin(db, req.headers.get("Authorization")))) {
      return json({ error: "Seu login não foi reconhecido como dona do painel. Saia e entre de novo." }, 401);
    }
  }

  const missing = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"].filter((k) => !env(k));
  if (missing.length) {
    const what = missing.length === 1 ? `Falta o segredo ${missing[0]}` : `Faltam os segredos ${missing.join(" e ")}`;
    return json({ error: `${what} na função (Supabase → Edge Functions → Secrets).` }, 500);
  }

  webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:contato@tspa.com.br", env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
  const send: SendFn = async (sub, payload) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60, urgency: "high" },
      );
      return { ok: true, gone: false };
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      const message = (err as { body?: string }).body || (err as Error).message;
      console.error("push falhou", status, message);
      return { ok: false, gone: status === 404 || status === 410, error: `${status ?? "?"} ${String(message).slice(0, 200)}` };
    }
  };

  try {
    const result = await runNotifications(db, send, { test });
    if (test && result.subscriptions === 0) {
      return json({ error: "Nenhum aparelho ativado. Toque em Desativar e Ativar neste aparelho de novo." }, 409);
    }
    if (test && result.delivered === 0) {
      return json({ error: `O serviço de notificações recusou o envio (${result.failures[0] ?? "sem detalhe"}). Toque em Desativar e Ativar neste aparelho de novo.` }, 502);
    }
    return json(result);
  } catch (err) {
    console.error(err);
    const message = (err as { message?: string }).message ?? String(err);
    return json({ error: `Falha ao enviar: ${message}` }, 500);
  }
});
