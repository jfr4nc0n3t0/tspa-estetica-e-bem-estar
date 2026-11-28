import Reveal from "./Reveal";
import SectionTitle from "./SectionTitle";

const steps = [
  {
    moment: "Antes",
    title: "Comunicação acolhedora",
    text: "Uma conversa sem pressa pelo WhatsApp e a confirmação personalizada do seu horário.",
  },
  {
    moment: "Durante",
    title: "Um refúgio para os sentidos",
    text: "Aromas suaves, música baixa, iluminação quente e um atendimento atento a você.",
  },
  {
    moment: "Depois",
    title: "O cuidado continua",
    text: "Uma mensagem de cuidado, orientações para o dia a dia e o convite para voltar.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-background pb-8 pt-24 md:pt-32" data-testid="section-como-funciona">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionTitle eyebrow="A experiência TSpa" title="Do primeiro contato à memória afetiva." />
        </Reveal>
        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <Reveal as="li" key={step.moment} delay={index * 120} className="relative text-center">
              <span className="font-serif text-5xl italic text-marfim">{step.moment}</span>
              <h3 className="mt-3 font-serif text-2xl text-foreground">{step.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal>
          <p className="mx-auto mt-14 max-w-xl text-center text-sm text-muted-foreground">
            Reagendamentos e cancelamentos com pelo menos 24 horas de antecedência.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
