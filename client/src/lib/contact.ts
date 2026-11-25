export const WHATSAPP_PHONE = "5583988896935";
export const PHONE_DISPLAY = "(83) 98889-6935";
export const INSTAGRAM_URL = "https://instagram.com/tspa.jp";

const FROM_SITE = "Olá! Vim pelo site do TSpa";

export function whatsappUrl(message = `${FROM_SITE} e gostaria de agendar um momento.`) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

type BookingKind = "servico" | "experiencia" | "plano";

const kindLabel: Record<BookingKind, string> = {
  servico: "o serviço",
  experiencia: "a experiência",
  plano: "o plano",
};

/** Pre-filled WhatsApp message saying the visitor came from the site and what they want to book. */
export function bookingMessage(name: string, kind: BookingKind = "servico") {
  if (kind === "plano") return `${FROM_SITE} e gostaria de saber mais sobre ${kindLabel.plano} ${name}.`;
  return `${FROM_SITE} e gostaria de agendar ${kindLabel[kind]} ${name}.`;
}
