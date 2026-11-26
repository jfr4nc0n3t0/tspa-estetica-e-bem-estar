// Cloudflare Pages Function: POST /api/leads (formulário de interesse do site).
// Variáveis no projeto da Cloudflare: SUPABASE_URL, SUPABASE_PUBLIC_KEY e, opcional, TURNSTILE_SECRET_KEY.
import { handleLead, type LeadEnv } from "../../shared/leads";

type Context = { request: Request; env: LeadEnv };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

export async function onRequestPost({ request, env }: Context) {
  // Só aceita envios vindos do próprio site
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json(403, { message: "Origem não permitida." });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { message: "Envio inválido." });
  }
  const result = await handleLead(body, env, request.headers.get("CF-Connecting-IP") ?? undefined);
  return json(result.status, result.body);
}
