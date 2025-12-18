import { SiInstagram, SiFacebook, SiWhatsapp } from "react-icons/si";

const quickLinks = [
  { label: "Sobre", href: "#sobre" },
  { label: "Experiências", href: "#experiencias" },
  { label: "Localização", href: "#localizacao" },
  { label: "Contato", href: "#contato" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/tspa.estetica",
    icon: SiInstagram,
  },
  {
    label: "Facebook",
    href: "https://facebook.com/tspa.estetica",
    icon: SiFacebook,
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/5583988896935",
    icon: SiWhatsapp,
  },
];

export default function Footer() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-card border-t border-border" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="py-12 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-serif text-2xl font-bold text-foreground">
                TSpa
              </span>
              <span className="font-serif text-lg font-light text-primary">
                Estética e Bem-Estar
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Fisioterapia e bem-estar em perfeita harmonia. 
              Cuidamos do seu corpo e mente com tratamentos exclusivos.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Links Rápidos</h3>
            <nav className="space-y-2">
              {quickLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="block text-muted-foreground hover:text-primary transition-colors text-sm"
                  data-testid={`link-footer-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Redes Sociais</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <p className="text-muted-foreground text-sm mt-4">
              Siga-nos para dicas de bem-estar<br />
              e novidades exclusivas.
            </p>
          </div>
        </div>

        <div className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TSpa Estética e Bem-Estar. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <a href="#" className="hover:text-primary transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Termos de Uso
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
