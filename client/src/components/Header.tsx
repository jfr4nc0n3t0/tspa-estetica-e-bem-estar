import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/tspa_refugio_mark.png";

const navItems = [
  { label: "Início", href: "#inicio" },
  { label: "Sobre", href: "#sobre" },
  { label: "Serviços", href: "#servicos" },
  { label: "Localização", href: "#localizacao" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById("sobre");
      const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 80;
      setIsScrolled(
        Boolean(aboutSection && aboutSection.getBoundingClientRect().top <= headerBottom),
      );
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    if (document.documentElement.dataset.heroRevealLocked === "true") return;

    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-lg shadow-sm border-b border-border"
          : "bg-transparent"
      }`}
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 md:h-20">
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#inicio");
            }}
            className="flex items-center gap-2"
            data-testid="link-logo"
          >
            <img
              src={logoImage}
              alt="TSpa"
              className={`h-auto w-16 md:w-20 ${isScrolled ? "" : "brightness-0 invert"}`}
            />
          </a>

          <nav
            className="hidden md:flex items-center gap-1 flex-wrap"
            data-testid="nav-desktop"
          >
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors hover-elevate ${
                  isScrolled
                    ? "text-foreground/80 hover:text-foreground"
                    : "text-white/90 hover:text-white"
                }`}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              onClick={() => {
                const phone = "5583988896935";
                const message = encodeURIComponent(
                  "Olá! Gostaria de agendar uma sessão no TSpa.",
                );
                window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
              }}
              className="rounded-full gap-2 bg-green-600 hover:bg-green-700 border-green-700"
              data-testid="button-agendar-header"
            >
              <SiWhatsapp className="h-4 w-4" />
              Agendar pelo WhatsApp
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden ${isScrolled ? "" : "text-white hover:bg-white/10"}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="md:hidden bg-background border-t border-border"
          data-testid="nav-mobile"
        >
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="px-4 py-3 text-left text-foreground/80 hover:text-foreground hover:bg-accent rounded-md transition-colors"
                data-testid={`link-mobile-${item.label.toLowerCase()}`}
              >
                {item.label}
              </button>
            ))}
            <Button
              onClick={() => {
                const phone = "5583988896935";
                const message = encodeURIComponent(
                  "Olá! Gostaria de agendar uma sessão no TSpa.",
                );
                window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
              }}
              className="mt-2 rounded-full gap-2 bg-green-600 hover:bg-green-700 border-green-700"
              data-testid="button-agendar-mobile"
            >
              <SiWhatsapp className="h-4 w-4" />
              Agendar pelo WhatsApp
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
