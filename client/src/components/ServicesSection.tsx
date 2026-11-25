import { ArrowUpRight, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  facialServices,
  feetRitual,
  headSpaServices,
  massageServices,
  type Session,
} from "@/data/services";
import { bookingMessage, whatsappUrl } from "@/lib/contact";
import PhotoCarousel from "./PhotoCarousel";
import Reveal from "./Reveal";
import SectionTitle from "./SectionTitle";

const categories = [
  {
    id: "head-spa",
    label: "Head Spa",
    intro: "Nossa assinatura. Cuidados no couro cabeludo e movimentos lentos — escolha o ritmo da sua pausa.",
    sessions: headSpaServices,
  },
  {
    id: "massagens",
    label: "Massagens",
    intro: "Técnicas manuais para aliviar tensões e devolver leveza ao corpo.",
    sessions: massageServices,
  },
  {
    id: "faciais",
    label: "Faciais",
    intro: "Pele cuidada, tempo desacelerado.",
    sessions: facialServices,
  },
  {
    id: "ritual-dos-pes",
    label: "Ritual dos Pés",
    intro: "O descanso também pode começar pelos pés.",
    sessions: feetRitual,
  },
];

function SessionCard({ session }: { session: Session }) {
  return (
    <article className="flex h-full flex-col" data-testid={`card-service-${session.id}`}>
      <PhotoCarousel
        images={session.images}
        label={session.name}
        className="aspect-[4/5] rounded-[1.25rem] sm:aspect-[4/4.4]"
      >
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {session.duration}
        </span>
      </PhotoCarousel>

      <div className="flex flex-1 flex-col pt-6">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-taupe">{session.characteristic}</p>
        <h3 className="mt-2 font-serif text-[1.75rem] leading-tight text-foreground">{session.name}</h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{session.phrase}</p>
        {session.note && <p className="mt-3 text-sm italic text-muted-foreground">{session.note}</p>}
        <a
          href={whatsappUrl(bookingMessage(session.name))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 self-start border-b border-primary/30 pb-1 pt-5 text-sm font-medium text-primary transition hover:border-primary"
        >
          Agendar este cuidado
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export default function ServicesSection() {
  return (
    <section id="servicos" className="scroll-mt-16 bg-nude py-24 md:py-32" data-testid="section-servicos">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionTitle
            eyebrow="Menu de cuidados"
            title="Seu tempo, vivido com presença."
            description="Escolha um cuidado para desacelerar e transformar alguns minutos do dia em uma experiência de bem-estar."
          />
        </Reveal>

        <Tabs defaultValue="head-spa" className="mt-12">
          <div className="no-scrollbar -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
            <TabsList className="mx-auto flex h-auto w-max gap-1 rounded-full border border-border bg-background/70 p-1.5 backdrop-blur">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                  data-testid={`tab-${category.id}`}
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent
              key={category.id}
              value={category.id}
              className="mt-10 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-500"
            >
              <p className="mx-auto max-w-xl text-center font-serif text-xl italic text-foreground/80 md:text-2xl">
                {category.intro}
              </p>
              <div
                className={`mt-12 grid gap-x-8 gap-y-14 ${
                  category.sessions.length === 1
                    ? "mx-auto max-w-sm"
                    : category.sessions.length === 2
                      ? "mx-auto max-w-4xl sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {category.sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
