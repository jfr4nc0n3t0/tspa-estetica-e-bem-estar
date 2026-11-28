// Cloudflare Pages Function: GET /api/mensagens (textos dos botões de WhatsApp editados no painel).
// Usa as mesmas variáveis do formulário: SUPABASE_URL e SUPABASE_PUBLIC_KEY.
import { fetchSiteMessages, type SiteMessagesEnv } from "../../shared/siteMessages";

export async function onRequestGet({ env }: { env: SiteMessagesEnv }) {
  const messages = await fetchSiteMessages(env);
  return new Response(JSON.stringify({ messages }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Mudança no painel aparece no site em até 5 minutos
      "Cache-Control": "public, max-age=300",
    },
  });
}
