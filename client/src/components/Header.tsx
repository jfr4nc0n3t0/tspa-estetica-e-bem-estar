import { useEffect, useState } from "react";
import { CalendarHeart, Menu, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/tspa_refugio_mark.png";
import { agendarUrl, whatsappUrl } from "@/lib/contact";

const navItems = [
  { label: "Sobre", href: "#sobre" },
  { label: "Cuidados", href: "#servicos" },
  { label: "Experiências", href: "#experiencias" },
  { label: "Planos", href: "#planos" },
  { label: "Visite", href: "#localizacao" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const solid = isScrolled || isMenuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid
          ? "border-b border-border/70 bg-background/90 shadow-[0_8px_30px_-20px_rgba(60,40,20,0.35)] backdrop-blur-xl"
          : "bg-gradient-to-b from-black/30 to-transparent"
      }`}
      data-testid="header"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:h-20 md:px-8">
        <a href="#inicio" className="flex items-center" data-testid="link-logo" onClick={() => setIsMenuOpen(false)}>
          <img
            src={logoImage}
            alt="TSpa — Refúgio do Corpo e da Alma"
            className={`h-auto w-16 transition md:w-20 ${solid ? "" : "brightness-0 invert"}`}
          />
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex" data-testid="nav-desktop">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-[0.8rem] font-medium uppercase tracking-[0.18em] transition-colors ${
                solid ? "text-foreground/70 hover:text-primary" : "text-white/85 hover:text-white"
              }`}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={agendarUrl()}
          className={`hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition md:inline-flex ${
            solid
              ? "bg-primary text-primary-foreground hover:bg-forest"
              : "border border-white/40 text-white hover:bg-white/10"
          }`}
          data-testid="button-agendar-header"
        >
          <CalendarHeart className="h-4 w-4" aria-hidden="true" />
          Agendar
        </a>

        <button
          type="button"
          className={`grid h-10 w-10 place-items-center rounded-full md:hidden ${
            solid ? "text-foreground" : "text-white"
          }`}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
          data-testid="button-mobile-menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div
          className="h-[calc(100svh-4rem)] overflow-y-auto bg-background px-6 pb-10 pt-6 md:hidden"
          data-testid="nav-mobile"
        >
          <nav aria-label="Menu" className="flex flex-col">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="border-b border-border/70 py-4 font-serif text-3xl text-foreground"
                data-testid={`link-mobile-${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href={agendarUrl()}
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-medium text-primary-foreground"
            data-testid="button-agendar-mobile"
          >
            <CalendarHeart className="h-4 w-4" aria-hidden="true" />
            Agendar meu momento
          </a>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full border border-primary/30 px-6 py-3.5 text-sm font-medium text-primary"
            data-testid="button-whatsapp-mobile"
          >
            <SiWhatsapp className="h-4 w-4" aria-hidden="true" />
            Prefere falar agora? WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}
