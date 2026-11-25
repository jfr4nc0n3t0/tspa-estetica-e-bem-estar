export const WHATSAPP_PHONE = "5583988896935";
export const PHONE_DISPLAY = "(83) 98889-6935";
export const INSTAGRAM_URL = "https://instagram.com/tspa.jp";

export function whatsappUrl(message = "Olá! Gostaria de agendar um momento no TSpa.") {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export function bookingMessage(serviceName: string) {
  return `Olá! Gostaria de agendar: ${serviceName}.`;
}
