import { useEffect, useState } from "react";

/**
 * Textos dos botões de WhatsApp do site. Os originais ficam aqui (iguais aos do painel, em
 * admin/src/lib/messages.ts); o que a dona mudar em Mais → Mensagens chega por /api/mensagens.
 * Um trecho entre colchetes some quando alguma {informação} dentro dele está vazia.
 */
export const SITE_MESSAGES = {
  site_whatsapp: "Olá! Vim pelo site do TSpa e gostaria de agendar um momento.",
  site_vale_presente: "Olá! Vim pelo site do TSpa e gostaria de um vale-presente de {valor} ({cuidado}).",
  site_vale_presente_livre: "Olá! Vim pelo site do TSpa e gostaria de dar um vale-presente.",
  site_formulario_enviado: "Olá! Acabei de deixar meu contato no site do TSpa[ e tenho interesse em {interesse}].",
} as const;

export type SiteMessageKey = keyof typeof SITE_MESSAGES;

let overrides: Partial<Record<SiteMessageKey, string>> = {};
let loading: Promise<void> | null = null;

function fill(body: string, vars: Record<string, string | null | undefined>) {
  const value = (name: string) => (vars[name] ?? "").toString().trim();
  return body
    .replace(/\[([^[\]]*)\]/g, (_, inner: string) =>
      Array.from(inner.matchAll(/\{(\w+)\}/g), (m) => m[1]).some((n) => !value(n)) ? "" : inner,
    )
    .replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? value(name) : match));
}

/** Mensagem pronta (texto editado no painel, ou o original). */
export function siteMessage(key: SiteMessageKey, vars: Record<string, string | null | undefined> = {}) {
  return fill(overrides[key] ?? SITE_MESSAGES[key], vars);
}

function loadSiteMessages() {
  loading ??= fetch("/api/mensagens")
    .then((r) => (r.ok ? r.json() : { messages: {} }))
    .then((data: { messages?: Record<string, string> }) => {
      const next: Partial<Record<SiteMessageKey, string>> = {};
      for (const key of Object.keys(SITE_MESSAGES) as SiteMessageKey[]) {
        const body = data.messages?.[key];
        if (typeof body === "string" && body.trim()) next[key] = body;
      }
      overrides = next;
    })
    .catch(() => {});
  return loading;
}

/**
 * Busca os textos editados uma vez e redesenha a página quando chegam.
 * Fica no App: ao redesenhar, todos os links de WhatsApp pegam o texto novo.
 */
export function useSiteMessages() {
  const [, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    loadSiteMessages().then(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);
}
