import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLIC_KEY?.trim();

/** Erro de configuração para mostrar na tela, ou null se estiver tudo certo. */
export const configError: string | null = (() => {
  if (!url || !key) return "missing";
  if (key.startsWith("sb_secret_")) return "secret";
  // Chave antiga em formato JWT: confere se não é a service_role
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.role === "service_role") return "secret";
    } catch {
      /* chave em formato inesperado: deixa o Supabase reclamar */
    }
  }
  return null;
})();

export const supabase = createClient(url || "http://localhost", key || "chave-ausente", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Executa uma consulta do Supabase e lança o erro, se houver. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function run<T = any>(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw error;
  return data as T;
}
