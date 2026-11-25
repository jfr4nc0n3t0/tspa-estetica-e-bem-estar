import { Feather, HeartHandshake, Moon } from "lucide-react";
import profileImage from "@assets/perfil.jpg";
import Reveal from "./Reveal";

const pillars = [
  {
    icon: HeartHandshake,
    title: "Acolhimento",
    text: "Nossa essência é acolher profundamente — cada atendimento começa pela escuta.",
  },
  {
    icon: Feather,
    title: "Leveza",
    text: "Um ritmo sem pressa, para o corpo soltar as tensões e a mente descansar.",
  },
  {
    icon: Moon,
    title: "Discrição",
    text: "Um ambiente reservado e silencioso, com ética e presença em cada detalhe.",
  },
];

export default function AboutSection() {
  return (
    <section id="sobre" className="relative overflow-hidden bg-background py-24 md:py-32" data-testid="section-sobre">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal className="relative mx-auto w-full max-w-[20rem] lg:max-w-[22rem]">
          <div className="arch absolute -inset-3 border border-taupe/40" aria-hidden="true" />
          <div className="arch relative aspect-[1/2] overflow-hidden bg-muted shadow-[0_30px_60px_-30px_rgba(60,40,20,0.45)]">
            <img
              src={profileImage}
              alt="Thauany Santos, fisioterapeuta e fundadora do TSpa, sentada em frente ao arco de pedra iluminado da recepção"
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="absolute -bottom-6 left-1/2 w-max -translate-x-1/2 rounded-full border border-border bg-card px-6 py-3 text-center shadow-lg">
            <p className="font-serif text-2xl leading-none text-foreground">5 anos</p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">cuidando de pessoas</p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <span className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
            Quem cuida de você
          </span>
          <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.1] text-foreground md:text-5xl lg:text-[3.5rem]">
            Thauany Santos
          </h2>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Fisioterapeuta · Instrutora de Pilates · Fundadora do TSpa
          </p>

          <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            <p>
              Há 5 anos me dedico ao cuidado integral do corpo, com experiência em fisioterapia
              hospitalar, clínica e domiciliar — o que me deu um olhar amplo, humano e
              individualizado para cada pessoa.
            </p>
            <p>
              Com formação complementar em terapia manual e reabilitação, uno técnica, consciência
              corporal e relaxamento em atendimentos que vão além do alívio: são uma pausa de verdade.
            </p>
          </div>

          <blockquote className="mt-10 border-l-2 border-taupe pl-6 font-serif text-2xl italic leading-snug text-foreground md:text-[1.7rem]">
            “Aqui, o cuidado vai além da técnica: é uma experiência de atenção, presença e conexão
            com o próprio corpo.”
          </blockquote>
        </Reveal>
      </div>

      <div className="mx-auto mt-24 grid max-w-7xl gap-px overflow-hidden px-5 sm:grid-cols-3 md:px-8">
        {pillars.map((pillar, index) => (
          <Reveal
            key={pillar.title}
            delay={index * 120}
            className="border-t border-border pt-8 sm:px-6 sm:first:pl-0"
          >
            <pillar.icon className="h-6 w-6 text-taupe" strokeWidth={1.4} aria-hidden="true" />
            <h3 className="mt-4 font-serif text-2xl text-foreground">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
