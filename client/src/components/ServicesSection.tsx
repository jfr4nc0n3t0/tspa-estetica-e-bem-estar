import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles } from "lucide-react";

import relaxingMassageImg from "@assets/services/massagem-relaxante.jpg";
import drainageImg from "@assets/services/drenagem-linfatica.jpg";
import myofascialImg from "@assets/services/liberacao-miofascial.jpg";
import hydrationImg from "@assets/services/hidratacao-facial.jpg";
import cleansingImg from "@assets/services/limpeza-de-pele.jpg";
import feetRitualImg from "@assets/services/ritual-dos-pes.jpg";
import headSpaEssentialImg from "@assets/services/head-spa-essencial.jpg";
import headSpaImmersionImg from "@assets/services/head-spa-imersao.jpg";
import headSpaRitualImg from "@assets/services/head-spa-ritual.jpg";
import lightnessRitualImg from "@assets/services/ritual-leveza.jpg";
import renewedSkinRitualImg from "@assets/services/ritual-pele-renovada.jpg";
import slowDownRitualImg from "@assets/services/ritual-desacelerar.jpg";
import connectionRitualImg from "@assets/services/ritual-conexao.jpg";
import tspaRitualImg from "@assets/services/ritual-tspa.jpg";

type Session = {
  id: string;
  name: string;
  duration: string;
  characteristic: string;
  phrase: string;
  image: string;
  note?: string;
};

const massageServices: Session[] = [
  {
    id: "massagem-relaxante",
    name: "Massagem Relaxante",
    duration: "60 min",
    characteristic: "Movimentos suaves e envolventes",
    phrase: "Uma pausa para o corpo e para a mente, que ajuda a aliviar as tensões do dia e proporciona relaxamento, leveza e bem-estar.",
    image: relaxingMassageImg,
  },
  {
    id: "drenagem-linfatica",
    name: "Drenagem Linfática",
    duration: "60 min",
    characteristic: "Cuidado delicado e específico",
    phrase: "Movimentos suaves para uma experiência agradável de bem-estar e sensação de leveza.",
    image: drainageImg,
  },
  {
    id: "liberacao-miofascial",
    name: "Liberação Miofascial",
    duration: "60 min",
    characteristic: "Atenção às regiões de maior tensão",
    phrase: "Técnicas manuais que favorecem a mobilidade, aliviam desconfortos e proporcionam sensação de liberdade ao corpo.",
    image: myofascialImg,
  },
];

const facialServices: Session[] = [
  {
    id: "hidratacao-facial",
    name: "Hidratação Facial",
    duration: "50 min",
    characteristic: "Viço, conforto e luminosidade",
    phrase: "Cuidados selecionados ajudam a hidratar a pele e deixam uma aparência mais saudável e revitalizada.",
    image: hydrationImg,
  },
  {
    id: "limpeza-de-pele",
    name: "Limpeza de Pele",
    duration: "60 min",
    characteristic: "Higienização e cuidado equilibrado",
    phrase: "Um ritual para renovar a pele e recuperar sua aparência saudável, limpa e revitalizada.",
    image: cleansingImg,
  },
];

const feetRitual: Session[] = [
  {
    id: "ritual-dos-pes",
    name: "Ritual dos Pés",
    duration: "30 min",
    characteristic: "Uma pausa acolhedora para os pés",
    phrase: "Um ritual delicado para desacelerar, aliviar a sensação de cansaço e preparar o corpo para um momento de descanso.",
    image: feetRitualImg,
    note: "Disponível como complemento de outro serviço.",
  },
];

const headSpaServices: Session[] = [
  {
    id: "head-spa-essencial",
    name: "Head Spa Essencial",
    duration: "30 min",
    characteristic: "Para experimentar o Head Spa",
    phrase: "Cuidados no couro cabeludo e movimentos relaxantes para simplesmente desligar.",
    image: headSpaEssentialImg,
  },
  {
    id: "head-spa-imersao",
    name: "Head Spa Imersão",
    duration: "45 min",
    characteristic: "Cuidado da cabeça ao pescoço",
    phrase: "Uma experiência ampliada para deixar a correria do lado de fora e aproveitar uma pausa mais completa.",
    image: headSpaImmersionImg,
  },
  {
    id: "head-spa-ritual",
    name: "Head Spa Ritual",
    duration: "60 min",
    characteristic: "A experiência mais completa",
    phrase: "Um ritual prolongado de cuidado e relaxamento para transformar o atendimento em uma verdadeira pausa da rotina.",
    image: headSpaRitualImg,
  },
];

const experiences = [
  {
    id: "ritual-leveza",
    name: "Ritual Leveza",
    combination: "Massagem Relaxante + Ritual dos Pés",
    characteristic: "Relaxamento dos pés ao corpo",
    phrase: "Comece pelos pés e termine com o corpo relaxado. Uma combinação para desacelerar, aliviar tensões e sair mais leve.",
    image: lightnessRitualImg,
  },
  {
    id: "ritual-pele-renovada",
    name: "Ritual Pele Renovada",
    combination: "Limpeza de Pele + Hidratação Facial",
    characteristic: "Um cuidado facial completo",
    phrase: "Um cuidado para renovar e devolver vitalidade à pele, transformando o tratamento facial em um momento de autocuidado.",
    image: renewedSkinRitualImg,
  },
  {
    id: "ritual-desacelerar",
    name: "Ritual Desacelerar",
    combination: "Head Spa Imersão + Ritual dos Pés",
    characteristic: "Uma pausa da cabeça aos pés",
    phrase: "Uma experiência sensorial que une acolhimento e descanso para ajudar você a diminuir o ritmo.",
    image: slowDownRitualImg,
  },
  {
    id: "ritual-conexao",
    name: "Ritual Conexão",
    combination: "Head Spa Imersão + Massagem Relaxante",
    characteristic: "Relaxamento que continua pelo corpo",
    phrase: "Uma experiência para se reconectar com você, começando pela cabeça e seguindo pelo corpo.",
    image: connectionRitualImg,
  },
  {
    id: "ritual-tspa",
    name: "Ritual TSpa",
    combination: "Head Spa Ritual + Massagem Relaxante + Ritual dos Pés",
    characteristic: "A experiência TSpa mais completa",
    phrase: "Uma jornada de relaxamento para quem deseja reservar um tempo exclusivamente para si.",
    image: tspaRitualImg,
  },
];

const plans = [
  {
    id: "pausa-tspa",
    name: "Pausa TSpa",
    cadence: "Mensal",
    frequency: "1 atendimento por mês",
    benefit: "5% de benefício",
    phrase: "Um momento de cuidado para incluir na rotina, mês a mês.",
  },
  {
    id: "ritmo-tspa",
    name: "Ritmo TSpa",
    cadence: "Quinzenal",
    frequency: "2 atendimentos por mês",
    benefit: "5% de benefício",
    phrase: "Duas pausas no mês para cultivar o bem-estar com regularidade.",
  },
  {
    id: "ciclo-tspa",
    name: "Ciclo TSpa",
    cadence: "Trimestral",
    frequency: "1 atendimento por mês, durante 3 meses",
    benefit: "8% de benefício",
    phrase: "Um ciclo de cuidado contínuo, no seu ritmo.",
  },
  {
    id: "essencia-tspa",
    name: "Essência TSpa",
    cadence: "Semestral",
    frequency: "1 atendimento por mês, durante 6 meses",
    benefit: "10% de benefício",
    phrase: "Mais tempo para fazer do autocuidado parte da rotina.",
  },
];

const categories = [
  { id: "massagens", label: "Massagens" },
  { id: "faciais", label: "Cuidados faciais" },
  { id: "ritual-dos-pes", label: "Ritual dos pés" },
  { id: "head-spa", label: "Head Spa" },
  { id: "experiencias", label: "Experiências TSpa" },
  { id: "planos", label: "Planos TSpa" },
];

function SectionHeading({
  id,
  title,
  phrase,
}: {
  id: string;
  title: string;
  phrase: string;
}) {
  return (
    <div id={id} className="mb-8 scroll-mt-28">
      <div className="flex items-center gap-3 mb-3">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 className="text-2xl font-serif font-bold text-foreground">{title}</h3>
      </div>
      <p className="pl-8 text-muted-foreground">{phrase}</p>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <Card className="h-full overflow-hidden group flex flex-col" data-testid={`card-service-${session.id}`}>
      <div className="relative h-44 overflow-hidden">
        <img
          src={session.image}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute right-3 top-3 z-50 inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-bold text-stone-900 shadow-lg">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>{session.duration}</span>
        </div>
        <h4 className="absolute bottom-4 left-4 right-4 font-semibold text-white text-lg leading-tight">
          {session.name}
        </h4>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Característica</p>
        <p className="mt-1 font-medium text-foreground">{session.characteristic}</p>
        <p className="mt-4 border-l-2 border-primary/60 pl-3 text-sm leading-relaxed text-muted-foreground">
          {session.phrase}
        </p>
        {session.note && (
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            {session.note}
          </p>
        )}
      </div>
    </Card>
  );
}

function ExperienceCard({ experience }: { experience: (typeof experiences)[number] }) {
  return (
    <Card className="h-full overflow-hidden group flex flex-col" data-testid={`card-experience-${experience.id}`}>
      <div className="relative h-44 overflow-hidden">
        <img
          src={experience.image}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <h4 className="absolute bottom-4 left-4 right-4 font-semibold text-white text-lg leading-tight">
          {experience.name}
        </h4>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Combina</p>
        <p className="mt-1 text-sm font-medium text-foreground">{experience.combination}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-widest text-primary">Característica</p>
        <p className="mt-1 font-medium text-foreground">{experience.characteristic}</p>
        <p className="mt-4 border-l-2 border-primary/60 pl-3 text-sm leading-relaxed text-muted-foreground">
          {experience.phrase}
        </p>
      </div>
    </Card>
  );
}

export default function ServicesSection() {
  return (
    <section
      id="servicos"
      className="py-16 md:py-24 lg:py-32"
      data-testid="section-servicos"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
            Menu de experiências
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Seu tempo, vivido com presença.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Escolha um cuidado para desacelerar, cuidar de si e transformar alguns minutos do dia em uma experiência de bem-estar.
          </p>
        </div>

        <nav aria-label="Categorias do menu de experiências" className="mb-16 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              {category.label}
            </a>
          ))}
        </nav>

        <div className="mb-16">
          <SectionHeading id="massagens" title="Massagens & Terapias" phrase="Cuidado que devolve leveza." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {massageServices.map((session) => <SessionCard key={session.id} session={session} />)}
          </div>
        </div>

        <div className="mb-16">
          <SectionHeading id="faciais" title="Cuidados Faciais" phrase="Pele cuidada. Tempo desacelerado." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {facialServices.map((session) => <SessionCard key={session.id} session={session} />)}
          </div>
        </div>

        <div className="mb-16">
          <SectionHeading id="ritual-dos-pes" title="Rituais" phrase="O descanso também pode começar pelos pés." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feetRitual.map((session) => <SessionCard key={session.id} session={session} />)}
          </div>
        </div>

        <div className="mb-16">
          <SectionHeading id="head-spa" title="Head Spa" phrase="Escolha o ritmo da sua pausa." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {headSpaServices.map((session) => <SessionCard key={session.id} session={session} />)}
          </div>
        </div>

        <div className="mb-16">
          <SectionHeading id="experiencias" title="Experiências TSpa" phrase="Mais do que combinar serviços, criamos momentos para você aproveitar seu cuidado por completo." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => <ExperienceCard key={experience.id} experience={experience} />)}
          </div>
        </div>

        <div>
          <SectionHeading id="planos" title="Planos TSpa" phrase="Bem-estar também pode virar rotina. Escolha o seu ritmo." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="h-full p-5" data-testid={`card-plan-${plan.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-primary">{plan.cadence}</p>
                    <h4 className="mt-1 font-serif text-xl font-bold text-foreground">{plan.name}</h4>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{plan.benefit}</Badge>
                </div>
                <p className="mt-5 font-medium text-foreground">{plan.frequency}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.phrase}</p>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Condições e valores finais são apresentados no momento da contratação.
          </p>
        </div>
      </div>
    </section>
  );
}
