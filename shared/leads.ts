// Formulário de interesse (tspa.com.br/agendar): validação, proteção contra spam e gravação no Supabase.
// Usado pelo servidor Express (server/routes.ts) e pela função da Cloudflare (functions/api/leads.ts).
import { z } from "zod";

export const LEAD_SOURCES = ["instagram", "whatsapp", "indicacao", "google", "site", "outro"] as const;

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  whatsapp: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(13)),
  interest: z.string().trim().max(300).optional(),
  source: z.enum(LEAD_SOURCES).catch("site"),
  consent: z.literal(true),
  // Proteção contra spam: campo invisível que só robôs preenchem e tempo de preenchimento
  website: z.string().optional(),
  elapsedMs: z.number().optional(),
  // Token do Cloudflare Turnstile (só quando estiver configurado)
  turnstileToken: z.string().max(2048).optional(),
});

export type LeadEnv = {
  SUPABASE_URL?: string;
  SUPABASE_PUBLIC_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Opcional: endereços aceitos, separados por vírgula (ex.: "tspa.com.br,www.tspa.com.br") */
  TURNSTILE_HOSTNAMES?: string;
};

/** Nome da ação do widget no formulário (o servidor confere). */
export const TURNSTILE_ACTION = "lead";

export type LeadResult = { status: number; body: { ok?: true; message?: string } };

const TRY_WHATSAPP = "Não conseguimos enviar agora. Tente de novo ou chame no WhatsApp.";

/** Confere o "não sou robô" da Cloudflare. Sem chave secreta configurada, não bloqueia. */
async function turnstileOk(env: LeadEnv, token: string | undefined, ip: string | undefined) {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (!token) return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean; action?: string; hostname?: string };
    if (data.success !== true) return false;
    // O token precisa ter sido gerado por este formulário…
    if (data.action && data.action !== TURNSTILE_ACTION) return false;
    // …e, se configurado, num dos endereços do site
    const hostnames = (env.TURNSTILE_HOSTNAMES ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
    if (hostnames.length && !hostnames.includes((data.hostname ?? "").toLowerCase())) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida o envio e grava o lead usando só a chave PÚBLICA do Supabase:
 * pelas regras do banco ela pode inserir leads, nunca ler.
 */
export async function handleLead(body: unknown, env: LeadEnv, ip?: string): Promise<LeadResult> {
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { message: "Confira o nome, o WhatsApp com DDD e o aceite de privacidade." } };
  }
  const lead = parsed.data;

  // Robô: responde "ok" sem gravar, para não ensinar como passar pelo filtro
  if (lead.website || (lead.elapsedMs !== undefined && lead.elapsedMs < 2500)) {
    return { status: 201, body: { ok: true } };
  }

  if (!(await turnstileOk(env, lead.turnstileToken, ip))) {
    return { status: 400, body: { message: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." } };
  }

  const url = env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = env.SUPABASE_PUBLIC_KEY?.trim();
  if (!url || !key) {
    console.error("[leads] SUPABASE_URL ou SUPABASE_PUBLIC_KEY não configurados");
    return { status: 503, body: { message: "Formulário indisponível no momento. Chame a gente no WhatsApp." } };
  }

  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`; // chave "anon" antiga (JWT)

  try {
    const response = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: lead.name,
        whatsapp: lead.whatsapp,
        interest: lead.interest || null,
        source: lead.source,
        consent: true,
        consent_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      console.error("[leads] Supabase recusou o lead:", response.status, await response.text());
      return { status: 502, body: { message: TRY_WHATSAPP } };
    }
    return { status: 201, body: { ok: true } };
  } catch (err) {
    console.error("[leads] Falha ao falar com o Supabase:", err);
    return { status: 502, body: { message: TRY_WHATSAPP } };
  }
}
