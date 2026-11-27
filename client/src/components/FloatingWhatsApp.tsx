import { SiWhatsapp } from "react-icons/si";
import { whatsappUrl } from "@/lib/contact";

/**
 * Botão de WhatsApp sempre à mão no celular. Quem decide quando aparece é a página (Home):
 * depois da abertura, longe do rodapé e quando o convite de primeira visita não está aberto.
 */
export default function FloatingWhatsApp({ shown }: { shown: boolean }) {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar pelo WhatsApp"
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      data-testid="link-whatsapp-flutuante"
      className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-black/15 transition-all duration-300 md:hidden ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <SiWhatsapp className="h-5 w-5" aria-hidden="true" />
      WhatsApp
    </a>
  );
}
