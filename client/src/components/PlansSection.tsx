import { plans } from "@/data/services";
import { agendarUrl } from "@/lib/contact";
import Reveal from "./Reveal";
import SectionTitle from "./SectionTitle";

export default function PlansSection() {
  return (
    <section id="planos" className="scroll-mt-16 bg-background py-24 md:py-32" data-testid="section-planos">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionTitle
            eyebrow="Planos TSpa"
            title="Bem-estar também vira rotina."
            description="Escolha o seu ritmo e garanta seus momentos de cuidado ao longo do mês."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => {
            const featured = plan.id === "essencia-tspa";
            return (
              <Reveal key={plan.id} delay={index * 90}>
                <article
                  className={`flex h-full flex-col rounded-[1.25rem] border p-7 transition hover:-translate-y-1 ${
                    featured
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                  data-testid={`card-plan-${plan.id}`}
                >
                  <p className={`text-[0.7rem] font-medium uppercase tracking-[0.22em] ${featured ? "text-nude" : "text-taupe"}`}>
                    {plan.cadence}
                  </p>
                  <h3 className="mt-3 font-serif text-3xl">{plan.name}</h3>
                  <p className={`mt-6 font-serif text-5xl ${featured ? "" : "text-primary"}`}>
                    {plan.benefit.replace(" de benefício", "")}
                    <span className={`ml-2 align-middle font-sans text-xs uppercase tracking-[0.18em] ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      de benefício
                    </span>
                  </p>
                  <p className={`mt-6 border-t pt-5 text-sm font-medium ${featured ? "border-white/20" : "border-border"}`}>
                    {plan.frequency}
                  </p>
                  <p className={`mt-2 text-sm leading-relaxed ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {plan.phrase}
                  </p>
                  <a
                    href={agendarUrl(`Plano ${plan.name}`)}
                    className={`mt-auto pt-7 text-sm font-medium underline-offset-4 hover:underline ${featured ? "" : "text-primary"}`}
                  >
                    Quero este plano →
                  </a>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Condições e valores finais são apresentados no momento da contratação.
        </p>
      </div>
    </section>
  );
}
