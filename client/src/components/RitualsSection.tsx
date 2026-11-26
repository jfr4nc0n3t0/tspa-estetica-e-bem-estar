import { ArrowUpRight } from "lucide-react";
import { experiences } from "@/data/services";
import { agendarUrl } from "@/lib/contact";
import PhotoCarousel from "./PhotoCarousel";
import Reveal from "./Reveal";
import SectionTitle from "./SectionTitle";

export default function RitualsSection() {
  const [signature, ...others] = [...experiences].reverse();

  return (
    <section id="experiencias" className="scroll-mt-16 bg-forest py-24 text-white md:py-32" data-testid="section-experiencias">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionTitle
            tone="dark"
            eyebrow="Experiências TSpa"
            title="Um tempo para você."
            description="Mais do que combinar serviços: momentos pensados para você aproveitar o cuidado por completo."
          />
        </Reveal>

        {/* Signature ritual, highlighted */}
        <Reveal className="mt-16">
          <article className="grid overflow-hidden rounded-[1.5rem] bg-white/[0.04] ring-1 ring-white/10 lg:grid-cols-2">
            <PhotoCarousel
              images={signature.images}
              label={signature.name}
              className="aspect-[4/3] lg:aspect-auto lg:min-h-[28rem]"
            />
            <div className="flex flex-col justify-center p-8 md:p-12">
              <span className="self-start rounded-full border border-sand/50 px-3 py-1 text-[0.7rem] uppercase tracking-[0.22em] text-sand">
                Experiência mais completa
              </span>
              <h3 className="mt-5 font-serif text-4xl md:text-5xl">{signature.name}</h3>
              <p className="mt-3 text-sm uppercase tracking-[0.16em] text-white/60">{signature.combination}</p>
              <p className="mt-6 text-lg leading-relaxed text-white/80">{signature.phrase}</p>
              <a
                href={agendarUrl(signature.name)}
                className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-nude px-6 py-3 text-sm font-medium text-forest transition hover:bg-white"
              >
                Reservar o {signature.name}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        </Reveal>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((experience, index) => (
            <Reveal key={experience.id} delay={index * 100}>
              <article className="flex h-full flex-col" data-testid={`card-experience-${experience.id}`}>
                <PhotoCarousel
                  images={experience.images}
                  label={experience.name}
                  className="aspect-[4/5] rounded-[1.25rem]"
                />
                <h3 className="mt-5 font-serif text-2xl">{experience.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-sand/90">{experience.combination}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{experience.phrase}</p>
                <a
                  href={agendarUrl(experience.name)}
                  className="mt-auto inline-flex items-center gap-1.5 self-start border-b border-sand/40 pb-1 pt-5 text-sm font-medium text-sand transition hover:border-sand"
                >
                  Reservar
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
