import { siteMessage } from "./messages";

export const WHATSAPP_PHONE = "5583988896935";
export const PHONE_DISPLAY = "(83) 98889-6935";
export const INSTAGRAM_URL = "https://instagram.com/tspa.jp";

const FROM_SITE = "Olá! Vim pelo site do TSpa";

export function whatsappUrl(message = siteMessage("site_whatsapp")) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

/**
 * Link para o formulário de interesse (/agendar). Marca a origem "site" e, se vier,
 * já deixa o cuidado escolhido no campo "O que você gostaria de viver?".
 */
export function agendarUrl(interest?: string) {
  const params = new URLSearchParams({ origem: "site" });
  if (interest) params.set("interesse", interest);
  return `/agendar?${params.toString()}`;
}

type BookingKind = "servico" | "experiencia" | "pacote";

const kindLabel: Record<BookingKind, string> = {
  servico: "o serviço",
  experiencia: "a experiência",
  pacote: "o pacote",
};

/** Pre-filled WhatsApp message saying the visitor came from the site and what they want to book. */
export function bookingMessage(name: string, kind: BookingKind = "servico") {
  if (kind === "pacote") return `${FROM_SITE} e gostaria de saber mais sobre ${kindLabel.pacote} ${name}.`;
  return `${FROM_SITE} e gostaria de agendar ${kindLabel[kind]} ${name}.`;
}
