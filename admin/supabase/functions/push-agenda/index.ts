// Supabase Edge Function "push-agenda": envia as notificações do painel.
//   • Chamada a cada 5 minutos pelo agendador do banco (cabeçalho x-cron-secret).
//   • Chamada pelo painel com { "action": "test" } para mandar uma notificação de teste
//     (só a dona logada consegue).
// Segredos necessários (Supabase → Edge Functions → Secrets): veja admin/NOTIFICACOES.md.

import { createClient } from "npm:@supabase/supabase-js@2";
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

/** A chamada vem da dona logada no painel? */
async function isAdmin(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const userClient = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await userClient.rpc("is_admin");
  return !error && data === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const fromCron = sameSecret(req.headers.get("x-cron-secret") ?? "", env("CRON_SECRET"));
  const body = await req.json().catch(() => ({}));
  const test = body?.action === "test";

  if (!fromCron && !(test && (await isAdmin(req.headers.get("Authorization"))))) {
    return json({ error: "Não autorizado" }, 401);
  }
  if (!env("VAPID_PUBLIC_KEY") || !env("VAPID_PRIVATE_KEY")) {
    return json({ error: "Faltam as chaves VAPID nos segredos da função." }, 500);
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
      console.error("push falhou", status, (err as Error).message);
      return { ok: false, gone: status === 404 || status === 410 };
    }
  };

  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  try {
    return json(await runNotifications(db, send, { test }));
  } catch (err) {
    console.error(err);
    return json({ error: "Falha ao enviar notificações" }, 500);
  }
});
