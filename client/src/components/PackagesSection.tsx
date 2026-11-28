import { brl, packages } from "@/data/services";
import { agendarUrl } from "@/lib/contact";
import Reveal from "./Reveal";
import SectionTitle from "./SectionTitle";

/** Pacotes pagos de uma vez, com número de sessões, prazo e valor em reais. */
export default function PackagesSection() {
  return (
    <section id="pacotes" className="scroll-mt-16 bg-background py-24 md:py-32" data-testid="section-pacotes">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionTitle
            eyebrow="Pacotes TSpa"
            title="Bem-estar também vira rotina."
            description="Monte o seu pacote com o cuidado que você preferir: Head Spa, massagens, faciais ou Ritual dos Pés. Você paga uma vez (pode parcelar no cartão) e usa as sessões dentro do prazo."
          />
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
          {packages.map((pkg, index) => {
            const featured = pkg.id === "essencia-tspa";
            return (
              <Reveal key={pkg.id} delay={index * 90}>
                <article
                  className={`flex h-full flex-col rounded-[1.25rem] border p-7 transition hover:-translate-y-1 ${
                    featured ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"
                  }`}
                  data-testid={`card-pacote-${pkg.id}`}
                >
                  <p className={`text-[0.7rem] font-medium uppercase tracking-[0.22em] ${featured ? "text-nude" : "text-taupe"}`}>
                    {pkg.cadence}
                    {featured && " · mais completo"}
                  </p>
                  <h3 className="mt-3 font-serif text-3xl">{pkg.name}</h3>
                  <p className={`mt-5 font-serif text-5xl ${featured ? "" : "text-primary"}`}>
                    {pkg.discount}%
                    <span className={`ml-2 align-middle font-sans text-xs uppercase tracking-[0.18em] ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      de desconto
                    </span>
                  </p>
                  <p className="mt-4 text-sm font-medium">
                    {pkg.sessions} sessões para usar em {pkg.months} meses
                    {pkg.bonus && ` + ${pkg.bonus}`}
                  </p>
                  <p className={`mt-5 border-t pt-5 text-[0.7rem] font-medium uppercase tracking-[0.18em] ${featured ? "border-white/20 text-primary-foreground/70" : "border-border text-muted-foreground"}`}>
                    Por exemplo, com
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    {pkg.examples.map((ex) => (
                      <div key={ex.service} className="flex items-baseline justify-between gap-3">
                        <dt className={featured ? "text-primary-foreground/80" : "text-muted-foreground"}>{ex.service}</dt>
                        <dd className="whitespace-nowrap font-medium">
                          <s className={`mr-1.5 font-normal ${featured ? "text-primary-foreground/50" : "text-muted-foreground/70"}`}>{brl(ex.full)}</s>
                          {brl(ex.price)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className={`mt-3 text-xs ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    …ou com o cuidado que você escolher.
                  </p>
                  <a
                    href={agendarUrl(`Pacote ${pkg.name}`)}
                    className={`mt-auto pt-7 text-sm font-medium underline-offset-4 hover:underline ${featured ? "" : "text-primary"}`}
                  >
                    Quero este pacote →
                  </a>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          Os pacotes são pessoais. Cancelando com pelo menos 24 horas de antecedência, a sessão volta para o seu pacote; falta sem aviso conta como sessão usada.
        </p>
      </div>
    </section>
  );
}
