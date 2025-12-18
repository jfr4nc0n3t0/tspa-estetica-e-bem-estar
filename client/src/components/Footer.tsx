import { SiInstagram, SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/WhatsApp_Image_2025-12-17_at_21.23.53_1766017460095.jpeg";

const quickLinks = [
  { label: "Sobre", href: "#sobre" },
  { label: "Serviços", href: "#servicos" },
  { label: "Localização", href: "#localizacao" },
  { label: "Contato", href: "#contato" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/thauanysantos.fisio",
    icon: SiInstagram,
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/5583999999999",
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
    <footer className="bg-secondary text-secondary-foreground" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="py-12 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logoImage}
                alt="Thauany Santos Fisioterapia"
                className="h-16 w-auto object-contain rounded-lg"
              />
            </div>
            <p className="text-secondary-foreground/80 text-sm leading-relaxed">
              Fisioterapia domiciliar com atendimento humanizado e personalizado. 
              Cuidando da sua saúde no conforto do seu lar.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-secondary-foreground mb-4">Links Rápidos</h3>
            <nav className="space-y-2">
              {quickLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="block text-secondary-foreground/70 hover:text-primary transition-colors text-sm"
                  data-testid={`link-footer-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-semibold text-secondary-foreground mb-4">Redes Sociais</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/70 hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <p className="text-secondary-foreground/70 text-sm mt-4">
              Siga para dicas de saúde<br />
              e novidades sobre fisioterapia.
            </p>
          </div>
        </div>

        <div className="py-6 border-t border-secondary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-secondary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Thauany Santos - Fisioterapia HomeCare. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
