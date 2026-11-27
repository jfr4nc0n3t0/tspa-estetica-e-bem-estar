import { useEffect, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { whatsappUrl } from "@/lib/contact";

/**
 * Botão de WhatsApp sempre à mão no celular. Aparece depois que a pessoa passa do topo
 * (para não cobrir a abertura) e some perto do rodapé, que já tem o contato.
 */
export default function FloatingWhatsApp() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.7;
      const footer = document.querySelector("footer");
      const nearFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight - 40 : false;
      setVisible(pastHero && !nearFooter);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar pelo WhatsApp"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      data-testid="link-whatsapp-flutuante"
      className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-black/15 transition-all duration-300 md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <SiWhatsapp className="h-5 w-5" aria-hidden="true" />
      WhatsApp
    </a>
  );
}
