import type { Express, Request } from "express";
import { type Server } from "http";
import { z } from "zod";

const LEAD_SOURCES = ["instagram", "whatsapp", "indicacao", "google", "site", "outro"] as const;

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
});

// Limite simples por IP: no máximo 5 envios a cada 10 minutos
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recentByIp = new Map<string, number[]>();

function isRateLimited(req: Request) {
  const now = Date.now();
  const ip = req.ip ?? "unknown";
  const recent = (recentByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  recentByIp.set(ip, recent);
  if (recentByIp.size > 5000) {
    recentByIp.forEach((times, key) => {
      if (times.every((t) => now - t >= WINDOW_MS)) recentByIp.delete(key);
    });
  }
  return recent.length > MAX_PER_WINDOW;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Formulário público de interesse (tspa.com.br/agendar) → tabela "leads" do Supabase.
  // Usa só a chave pública: pelas regras do banco ela pode INSERIR leads, nunca ler.
  app.post("/api/leads", async (req, res) => {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Confira o nome, o WhatsApp com DDD e o aceite de privacidade." });
    }
    const lead = parsed.data;

    // Robô: responde "ok" sem gravar, para não ensinar como passar pelo filtro
    if (lead.website || (lead.elapsedMs !== undefined && lead.elapsedMs < 2500)) {
      return res.status(201).json({ ok: true });
    }
    if (isRateLimited(req)) {
      return res.status(429).json({ message: "Muitos envios seguidos. Tente de novo em alguns minutos ou chame no WhatsApp." });
    }

    const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
    const key = process.env.SUPABASE_PUBLIC_KEY?.trim();
    if (!url || !key) {
      console.error("[leads] SUPABASE_URL ou SUPABASE_PUBLIC_KEY não configurados");
      return res.status(503).json({ message: "Formulário indisponível no momento. Chame a gente no WhatsApp." });
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
        return res.status(502).json({ message: "Não conseguimos enviar agora. Tente de novo ou chame no WhatsApp." });
      }
      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error("[leads] Falha ao falar com o Supabase:", err);
      return res.status(502).json({ message: "Não conseguimos enviar agora. Tente de novo ou chame no WhatsApp." });
    }
  });

  return httpServer;
}
