import type { Express, Request } from "express";
import { type Server } from "http";
import { handleLead } from "@shared/leads";

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
  // A mesma lógica roda na Cloudflare em functions/api/leads.ts.
  app.post("/api/leads", async (req, res) => {
    if (isRateLimited(req)) {
      return res.status(429).json({ message: "Muitos envios seguidos. Tente de novo em alguns minutos ou chame no WhatsApp." });
    }
    const { SUPABASE_URL, SUPABASE_PUBLIC_KEY, TURNSTILE_SECRET_KEY, TURNSTILE_HOSTNAMES } = process.env;
    const env = { SUPABASE_URL, SUPABASE_PUBLIC_KEY, TURNSTILE_SECRET_KEY, TURNSTILE_HOSTNAMES };
    const result = await handleLead(req.body, env, req.ip);
    return res.status(result.status).json(result.body);
  });

  return httpServer;
}
