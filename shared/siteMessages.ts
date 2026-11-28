// Textos dos botões de WhatsApp do site, editados no painel (Mais → Mensagens).
// Usado pelo servidor Express (server/routes.ts) e pela função da Cloudflare (functions/api/mensagens.ts).
// Só devolve as mensagens "site_…" (a função site_messages do banco já filtra) e nunca falha:
// sem banco ou com erro, o site segue com os textos originais.

export type SiteMessagesEnv = { SUPABASE_URL?: string; SUPABASE_PUBLIC_KEY?: string };

export async function fetchSiteMessages(env: SiteMessagesEnv): Promise<Record<string, string>> {
  const url = env.SUPABASE_URL?.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const key = env.SUPABASE_PUBLIC_KEY?.trim();
  if (!url || !key) return {};
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`; // chave "anon" antiga (JWT)
  try {
    const response = await fetch(`${url}/rest/v1/rpc/site_messages`, { method: "POST", headers, body: "{}" });
    if (!response.ok) return {};
    const rows = (await response.json()) as { key?: unknown; body?: unknown }[];
    const messages: Record<string, string> = {};
    for (const row of Array.isArray(rows) ? rows : []) {
      if (typeof row.key === "string" && /^site_[a-z_]+$/.test(row.key) && typeof row.body === "string" && row.body.trim()) {
        messages[row.key] = row.body.slice(0, 2000);
      }
    }
    return messages;
  } catch {
    return {};
  }
}
