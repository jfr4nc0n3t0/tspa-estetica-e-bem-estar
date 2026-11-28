import { ArrowUpRight } from "lucide-react";
import { brl, giftCards } from "@/data/services";
import { whatsappUrl } from "@/lib/contact";
import Reveal from "./Reveal";
import SectionTitle from "./SectionTitle";

const giftMessage = (price: number, item: string) =>
  `Olá! Vim pelo site do TSpa e gostaria de um vale-presente de ${brl(price)} (${item.split(" · ")[0]}).`;

/** Vale-presente: três valores, pedido pelo WhatsApp. */
export default function GiftSection() {
  return (
    <section id="vale-presente" className="scroll-mt-16 bg-nude py-24 md:py-28" data-testid="section-vale-presente">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionTitle
            eyebrow="Vale-presente"
            title="Presenteie com uma pausa."
            description="Enviado em cartão digital com o nome de quem vai receber. Pode ser usado por outra pessoa e vale por 90 dias."
          />
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {giftCards.map((gift, index) => {
            const featured = index === giftCards.length - 1;
            return (
              <Reveal key={gift.id} delay={index * 90}>
                <a
                  href={whatsappUrl(giftMessage(gift.price, gift.item))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex h-full flex-col rounded-[1.25rem] border p-7 transition hover:-translate-y-1 ${
                    featured ? "border-forest bg-forest text-white" : "border-border bg-card hover:border-primary/40"
                  }`}
                  data-testid={`link-${gift.id}`}
                >
                  <span className={`text-[0.7rem] font-medium uppercase tracking-[0.22em] ${featured ? "text-sand" : "text-taupe"}`}>{gift.label}</span>
                  <span className={`mt-3 font-serif text-5xl ${featured ? "" : "text-primary"}`}>{brl(gift.price)}</span>
                  <span className={`mt-3 text-sm ${featured ? "text-white/70" : "text-muted-foreground"}`}>{gift.item}</span>
                  <span
                    className={`mt-auto inline-flex items-center gap-1.5 self-start border-b pb-1 pt-6 text-sm font-medium ${
                      featured ? "border-sand/40 text-sand" : "border-primary/30 text-primary"
                    }`}
                  >
                    Presentear
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
