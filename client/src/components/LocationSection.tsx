import { CalendarHeart, MapPin, Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { PHONE_DISPLAY, WHATSAPP_PHONE, whatsappUrl } from "@/lib/contact";
import Reveal from "./Reveal";
import SectionTitle from "./SectionTitle";

const ADDRESS = "R. Mírian Barreto Rabelo, 135, Jardim Oceania, João Pessoa - PB, 58037-195";

export default function LocationSection() {
  return (
    <section id="localizacao" className="scroll-mt-16 bg-background py-24 md:py-32" data-testid="section-localizacao">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid items-stretch gap-10 overflow-hidden rounded-[1.75rem] bg-nude p-6 md:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:p-14">
          <Reveal className="flex flex-col">
            <SectionTitle
              align="left"
              eyebrow="Visite o TSpa"
              title="Seu refúgio no Jardim Oceania."
              description="Seu corpo também merece descanso. Um espaço tranquilo e de fácil acesso, pronto para receber você."
            />

            <address className="not-italic">
            <ul className="mt-10 space-y-6">
              <li className="flex gap-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-taupe" strokeWidth={1.6} aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">R. Mírian Barreto Rabelo, 135</p>
                  <p className="text-sm text-muted-foreground">Jardim Oceania, João Pessoa - PB · CEP 58037-195</p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Como chegar →
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <CalendarHeart className="mt-0.5 h-5 w-5 shrink-0 text-taupe" strokeWidth={1.6} aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">Atendimento com hora marcada</p>
                  <p className="text-sm text-muted-foreground">Somente por agendamento</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-taupe" strokeWidth={1.6} aria-hidden="true" />
                <a href={`tel:+${WHATSAPP_PHONE}`} className="font-medium text-foreground hover:text-primary">
                  {PHONE_DISPLAY}
                </a>
              </li>
            </ul>
            </address>

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-forest"
            >
              <SiWhatsapp className="h-4 w-4" aria-hidden="true" />
              Agendar pelo WhatsApp
            </a>
          </Reveal>

          <Reveal delay={150} className="min-h-[320px] overflow-hidden rounded-[1.25rem] shadow-[0_20px_50px_-30px_rgba(60,40,20,0.5)]">
            <iframe
              src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=R.+Mírian+Barreto+Rabelo,+135,+Jardim+Oceania,+João+Pessoa,+PB,+58037-195,+Brazil&zoom=16"
              className="h-full min-h-[320px] w-full grayscale-[35%] sepia-[15%]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do TSpa, Refúgio do Corpo e da Alma"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
