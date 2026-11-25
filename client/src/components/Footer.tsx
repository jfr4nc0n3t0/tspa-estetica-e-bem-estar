import { SiInstagram, SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/tspa_refugio_mark.png";
import { INSTAGRAM_URL, PHONE_DISPLAY, whatsappUrl } from "@/lib/contact";

const links = [
  { label: "Sobre", href: "#sobre" },
  { label: "Cuidados", href: "#servicos" },
  { label: "Experiências", href: "#experiencias" },
  { label: "Planos", href: "#planos" },
  { label: "Visite", href: "#localizacao" },
];

export default function Footer() {
  return (
    <footer className="bg-forest text-white/75" data-testid="footer">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col items-center gap-6 border-b border-white/10 py-16 text-center">
          <img src={logoImage} alt="TSpa" className="w-24 brightness-0 invert" />
          <p className="text-xs uppercase tracking-[0.4em] text-sand">Refúgio do corpo e da alma</p>
          <div className="flex gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @tspa.jp"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition hover:border-sand hover:text-sand"
              data-testid="link-social-instagram"
            >
              <SiInstagram className="h-4 w-4" />
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${PHONE_DISPLAY}`}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition hover:border-sand hover:text-sand"
              data-testid="link-social-whatsapp"
            >
              <SiWhatsapp className="h-4 w-4" />
            </a>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em]">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <p className="py-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} TSpa · Refúgio do Corpo e da Alma · João Pessoa, PB
        </p>
      </div>
    </footer>
  );
}
