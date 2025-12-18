import ServiceCard from "./ServiceCard";
import massageImage from "@assets/generated_images/therapeutic_massage_treatment.png";
import hotStoneImage from "@assets/generated_images/hot_stone_therapy_setup.png";
import facialImage from "@assets/generated_images/facial_treatment_session.png";
import aromatherapyImage from "@assets/generated_images/aromatherapy_oils_arrangement.png";
import physiotherapyImage from "@assets/generated_images/physiotherapy_rehabilitation_session.png";
import hydrotherapyImage from "@assets/generated_images/hydrotherapy_spa_pool.png";

const services = [
  {
    title: "Massagem Terapêutica",
    description: "Técnica especializada que combina movimentos profundos e precisos para aliviar tensões musculares, melhorar a circulação e promover relaxamento profundo.",
    image: massageImage,
    duration: "60 min",
    price: "R$ 180",
    benefits: [
      "Alívio de dores musculares",
      "Redução do estresse",
      "Melhora da circulação sanguínea",
      "Aumento da flexibilidade",
    ],
  },
  {
    title: "Hot Stone Therapy",
    description: "Tratamento luxuoso que utiliza pedras vulcânicas aquecidas para promover relaxamento muscular profundo e equilíbrio energético.",
    image: hotStoneImage,
    duration: "75 min",
    price: "R$ 220",
    benefits: [
      "Relaxamento muscular profundo",
      "Alívio de tensões crônicas",
      "Equilíbrio energético",
      "Sensação de bem-estar",
    ],
  },
  {
    title: "Tratamento Facial",
    description: "Cuidado completo para a pele do rosto com limpeza profunda, hidratação e técnicas de massagem facial rejuvenescedoras.",
    image: facialImage,
    duration: "50 min",
    price: "R$ 150",
    benefits: [
      "Limpeza profunda da pele",
      "Hidratação intensiva",
      "Rejuvenescimento facial",
      "Redução de linhas de expressão",
    ],
  },
  {
    title: "Aromaterapia",
    description: "Experiência sensorial única utilizando óleos essenciais puros para harmonizar corpo, mente e espírito através de fragrâncias terapêuticas.",
    image: aromatherapyImage,
    duration: "45 min",
    price: "R$ 130",
    benefits: [
      "Redução da ansiedade",
      "Melhora do humor",
      "Relaxamento mental",
      "Equilíbrio emocional",
    ],
  },
  {
    title: "Fisioterapia Especializada",
    description: "Tratamento personalizado com técnicas de fisioterapia avançada para reabilitação, prevenção de lesões e melhora da qualidade de movimento.",
    image: physiotherapyImage,
    duration: "60 min",
    price: "R$ 200",
    benefits: [
      "Reabilitação de lesões",
      "Melhora da postura",
      "Prevenção de dores",
      "Aumento da mobilidade",
    ],
  },
  {
    title: "Hidroterapia",
    description: "Terapia aquática em ambiente controlado que utiliza as propriedades da água para tratamento e relaxamento muscular.",
    image: hydrotherapyImage,
    duration: "45 min",
    price: "R$ 160",
    benefits: [
      "Relaxamento muscular",
      "Redução de dores articulares",
      "Melhora da circulação",
      "Desintoxicação corporal",
    ],
  },
];

export default function ExperiencesSection() {
  return (
    <section
      id="experiencias"
      className="py-16 md:py-24 lg:py-32 bg-muted/30"
      data-testid="section-experiencias"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
            Nossas Experiências
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Tratamentos Exclusivos
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Descubra nossa seleção de tratamentos cuidadosamente desenvolvidos para 
            proporcionar bem-estar, relaxamento e recuperação física.
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
