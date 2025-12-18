import ServiceCard from "./ServiceCard";
import { Activity, Brain, Heart, Users, Baby, Bone } from "lucide-react";

const services = [
  {
    title: "Fisioterapia Ortopédica",
    description: "Tratamento especializado para lesões e disfunções do sistema musculoesquelético, incluindo coluna, articulações, músculos e ligamentos.",
    icon: Bone,
    duration: "50-60 min",
    benefits: [
      "Tratamento de dores na coluna",
      "Recuperação de lesões articulares",
      "Reabilitação pós-cirúrgica",
      "Melhora da postura",
    ],
  },
  {
    title: "Fisioterapia Neurológica",
    description: "Reabilitação de pacientes com disfunções do sistema nervoso, visando recuperar movimentos e funcionalidade.",
    icon: Brain,
    duration: "50-60 min",
    benefits: [
      "Reabilitação pós-AVC",
      "Tratamento de Parkinson",
      "Esclerose múltipla",
      "Recuperação de mobilidade",
    ],
  },
  {
    title: "Fisioterapia Cardiorrespiratória",
    description: "Tratamento focado na melhora da função respiratória e cardiovascular, essencial para pacientes com problemas pulmonares.",
    icon: Heart,
    duration: "45-60 min",
    benefits: [
      "Melhora da capacidade respiratória",
      "Reabilitação cardíaca",
      "Doenças pulmonares crônicas",
      "Condicionamento físico",
    ],
  },
  {
    title: "Fisioterapia Geriátrica",
    description: "Atendimento especializado para idosos, focado na manutenção da independência funcional e qualidade de vida.",
    icon: Users,
    duration: "45-60 min",
    benefits: [
      "Prevenção de quedas",
      "Manutenção da mobilidade",
      "Fortalecimento muscular",
      "Independência nas atividades",
    ],
  },
  {
    title: "Fisioterapia Motora",
    description: "Exercícios terapêuticos para recuperação e manutenção da função motora, fortalecimento e flexibilidade.",
    icon: Activity,
    duration: "50-60 min",
    benefits: [
      "Fortalecimento muscular",
      "Melhora da flexibilidade",
      "Recuperação de movimentos",
      "Prevenção de lesões",
    ],
  },
  {
    title: "Fisioterapia Pediátrica",
    description: "Atendimento especializado para crianças, auxiliando no desenvolvimento motor e tratamento de condições específicas.",
    icon: Baby,
    duration: "40-50 min",
    benefits: [
      "Estimulação do desenvolvimento",
      "Tratamento de atrasos motores",
      "Correção postural infantil",
      "Reabilitação pediátrica",
    ],
  },
];

export default function ExperiencesSection() {
  return (
    <section
      id="servicos"
      className="py-16 md:py-24 lg:py-32 bg-muted/30"
      data-testid="section-servicos"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
            Serviços
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Especialidades em Fisioterapia
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Atendimento domiciliar completo com diversas especialidades para 
            atender às suas necessidades de saúde e bem-estar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
